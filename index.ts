import * as express from 'express';
import * as Git from 'nodegit';
import * as spawn from 'child_process';
import * as io from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

const registryUrl = '127.0.0.1:5000';
const port = 9000;
const repoDir = './tmp/';

let mysocket:SocketIO.Socket;

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
let Repo:Map<string,Git.Repository> = new Map();

function repoLoop(arr:Array<string>) {
    return arr.reduce(function(promise, repoPath) {
        return promise.then(function() {
            return Git.Repository.open(repoDir + repoPath)
			.then((repo:Git.Repository)=>{
				console.log('repo', repoPath);
				Repo.set(repoDir + repoPath, repo);
			})
        });
    }, Promise.resolve());
}
new Promise((resolve, reject)=>{
	fs.readdir(repoDir, (err:Error, files:string[])=>{
		resolve(files);
	})
})
.then((files:string[])=>{
	return repoLoop(files);
})
.then(()=>{
	console.log('express server load start');
	const app = express();
	app.use(express.static('dist'));
	app.use(express.static('src'));
	const socketserver = io(3000);
	socketserver.on('connect', (socket)=>{
		mysocket = socket;
		let currentRepo:string;
		console.log('connected');
		let repolist:string='';
		Repo.forEach((value, key)=>{
			repolist += `<div><button class="btn btn-primary" type="button" onclick="loadRepo('${key}')">${key}</button></div>`;
		})
		socket.emit('repolist', repolist);
		socket.on('debug', (data:any)=>{
			console.log('debug', data);
		})
		socket.on('url', (data:any)=>{
			let tUrlA = data.split('/');
			let last = tUrlA[tUrlA.length-1];
			let name = last.split('.')[0];
			let target:string;
			console.log(last, name);
			
			if( name != last)
				target = name;
			else 
				target = last;
			currentRepo = target;
			console.log('on url', target);
			mysocket.emit('data', 'set url '+data);
			let localPath = repoDir+target;
			let tRepo = Repo.get(localPath);
			if(tRepo){
				console.log('has');
				loadRepo(localPath);
			} else {
				console.log('new');
				// clone & load Repo commit
				cloneRepo(data, localPath)
			}
		});
		
		socket.on('build', (data:any)=>{
			let output:string[]=[];
			build(socket, currentRepo, output, data);
		});
		socket.on('loadRepo', (data:any)=>{
			currentRepo = data;
			loadRepo(data);
		});
	});
	
	
	app.get('/', (req: express.Request, res: express.Response) => {
		res.sendFile('/src/index.html');
	});
	
	app.listen(port, ()=>{
		console.log('server ready');
	});
})

const build = (socket:SocketIO.Socket, repoPath:string, output:string[], data:any)=>{
	let ckCommit:Git.Commit;
	// Git.Repository.open(repoPath)
	const repo = Repo.get(repoPath);
	if(repo != undefined) {
		repo.getCommit(data.hash)
		.then((commit:Git.Commit)=>{
			ckCommit = commit;
			console.log('git checkout');
			return Git.Checkout.tree(repo, ckCommit ,{checkoutStrategy:Git.Checkout.STRATEGY.SAFE});
		})
		.then(()=>{
			repo.setHeadDetached(ckCommit.id());
			console.log('build');
			return cli(`docker build -f ${repoPath}/Dockerfile -t ${ckCommit.sha().slice(0,5)} ${repoPath}`, output);
		}).then((output:string[])=>{
			console.log('add tag');
			return cli(`docker tag ${ckCommit.sha().slice(0,5)} ${registryUrl}/${ckCommit.sha().slice(0,5)}`, output);
		}).then((output:string[])=>{
			console.log('push');
			return cli(`docker push ${registryUrl}/${ckCommit.sha().slice(0,5)}`, output);
		}).then((output:string[])=>{
			console.log('end process');
			socket.emit('finish');
		});
	} 
}
const loadRepo = (localPath:string)=>{
	let commitlist: string = '';
	let repo = Repo.get(localPath);
	
	if(repo == undefined){
		return
	}
	repo.getBranchCommit('master')
	.then((bcommit:Git.Commit)=>{
		console.log('entry');
		const history = bcommit.history();
		history.on("commit", (commit:Git.Commit) =>{
			commitlist+= `<div><button class="btn btn-primary" type="button" onclick="buildDocker('${commit.sha()}')">${commit.sha().slice(0,5)} ${commit.message()}</button></div>`;
		});
		history.on('end', ()=>{
			console.log('end');
			mysocket.emit('repoInit', commitlist);
		});
		history.start();
	});
}

const cloneRepo = (url:string, localPath:string)=>{
	Git.Clone.clone(url, path.join(__dirname, localPath))
	.then((repo:Git.Repository)=>{
		Repo.set(localPath, repo);
		loadRepo(localPath);
	})
}
