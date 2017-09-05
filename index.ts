import * as express from 'express';
import * as Git from 'nodegit';
import * as spawn from 'child_process';
import * as io from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';
// import * as redis from 'redis';


const app = express();
app.use(express.static('dist'));
app.use(express.static('src'));

// const client = redis.createClient({
// 	host: '127.0.0.1',
// 	port: 6379
// });
// client.on('error', (error:Error)=>{
// 	console.log('error', error);
// });
// client.on('connect', ()=>{
// 	console.log('connect redis');
// })
const registryUrl = '127.0.0.1:5000';
const port = 9000;
const repoDir = './tmp/';

const socketserver = io(3000);
let mysocket:SocketIO.Socket;
let repourl = '';
let target = '';

const cli = (cmd:string, output:string[]):Promise<string[]> =>{
	const cmdSub = cmd.split(' ');
	cmdSub.shift();
	const cmdMain = cmd.split(' ', 1);
	return new Promise((resolve, reject)=>{
		const cmd = spawn.spawn(cmdMain[0], cmdSub);
		cmd.stdout.on('data', (data:any)=>{
			let msg = data.toString();
			console.log('data', msg);
			output.push(msg);
			mysocket.emit('data', msg);
		});
		cmd.stderr.on('data', (data:any)=>{
			let msg = data.toString();
			console.log('error', msg);
			output.push(msg);
			mysocket.emit('data', msg);
		})
		cmd.on('close', (code)=>{
			resolve(output);
		});
	})
}
let Repo:Git.Repository;
const getRepo = ()=>{
	return new Promise((resolve, reject)=>{
		console.log('getRepo', repoDir + target);
		Git.Repository.open(repoDir + target)
		.then((repo:Git.Repository)=>{
			Repo = repo;
			resolve(repo);
		}).catch((err)=>{
			console.log('no Repo', err);
			if(repourl){
				console.log('url', repourl);
				resolve(Git.Clone.clone(repourl, path.join(__dirname, repoDir, target)));
			}
		});
	});
}
let commitlist: string = '';
const repoInit = ()=>{
	commitlist = '';
	console.log('repoInit');
	getRepo()
	.then((repo:Git.Repository)=>{
		Repo = repo;
		repo.getBranchCommit('master')
		.then((bcommit:Git.Commit)=>{
			console.log('entry');
			const history = bcommit.history();
			history.on("commit", (commit:Git.Commit) =>{
				commitlist+= `<div><button class="btn btn-primary" type="button" onclick="buildDocker('${commit.sha()}')">${commit.sha().slice(0,5)} ${commit.message()}</button></div>`;
			});
			history.on('end', ()=>{
				console.log('end');
				mysocket.emit('repoInit');
			});
			history.start();
		});
	}).catch((error)=>{
		console.log('error', error);
	})
}

socketserver.on('connect', (socket)=>{
	mysocket = socket;
	console.log('connected');
	socket.on('debug', (data:any)=>{
		console.log('debug', data);
	})
	socket.on('url', (data:any)=>{
		
		repourl = data;
		let tUrlA = repourl.split('/');
		let last = tUrlA[tUrlA.length-1];
		let name = last.split('.')[0];
		console.log(last, name);
		if( name != last)
			target = name;
		else 
			target = last;
		console.log('on url', target);
		repoInit();
		mysocket.emit('data', 'set url '+data);
	});
	socket.on('getData', ()=>{
		console.log('getData');
		socket.emit('load', commitlist);
	})
	socket.on('build', (data:any)=>{
		console.log('build');
		
		if(Repo == undefined){
			console.log('NO Repo... build');
			return
		}
		let output:string[]=[];
		build(socket, Repo, output, data);
	});
});

const build = (socket:SocketIO.Socket, Repo:Git.Repository, output:string[], data:any)=>{
	let ckCommit:Git.Commit;
	return new Promise((resolve, reject)=>{
		Repo.getCommit(data.hash)
		.then((commit:Git.Commit)=>{
			ckCommit = commit;
			console.log('git checkout');
			return Git.Checkout.tree(Repo, ckCommit ,{checkoutStrategy:Git.Checkout.STRATEGY.SAFE});
		})
		.then(()=>{
			Repo.setHeadDetached(ckCommit.id());
			console.log('build');
			return cli(`docker build -f ${repoDir}${target}/Dockerfile -t ${ckCommit.sha().slice(0,5)} ${repoDir}${target}`, output);
		}).then((output:string[])=>{
			console.log('add tag');
			return cli(`docker tag ${ckCommit.sha().slice(0,5)} ${registryUrl}/${ckCommit.sha().slice(0,5)}`, output);
		}).then((output:string[])=>{
			console.log('push');
			return cli(`docker push ${registryUrl}/${ckCommit.sha().slice(0,5)}`, output);
		}).then((output:string[])=>{
			console.log('end process');
			socket.emit('finish');
			resolve();
		});
	})
}


app.get('/', (req: express.Request, res: express.Response) => {
	res.sendFile('/src/index.html');
});

app.listen(port, ()=>{
	console.log('server ready');
});