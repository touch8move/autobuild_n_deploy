import * as express from 'express';
import * as Git from 'nodegit';
import * as spawn from 'child_process';
// import * as redis from 'redis';
var sam1 = require('./sample');
var app = express();

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
var port = 9000;
var RP:Git.Repository;
var ckCommit: Git.Commit;
var target = '../travis';
Git.Repository.open('travis')
.then((repo:Git.Repository)=>{
	RP = repo;
}).catch(()=>{
	
});
var open = (name:string)=>{
	return Git.Repository.open(name);
}
var clone = (url:string, dirPath:string)=>{
	return Git.Clone.clone(url, dirPath)
}
var init = new Promise((resolve, reject)=>{
	open(target).then((repo:Git.Repository)=>{
		RP = repo;
		resolve(repo);
	}).catch(()=>{
		resolve(clone("https://github.com/touch8move/travis.git", target));
	})	
});
const cli = (cmd:string, output:string[]):Promise<string[]> =>{
	const cmdSub = cmd.split(' ');
	cmdSub.shift();
	const cmdMain = cmd.split(' ', 1);
	// console.log(cmdMain);
	// console.log(cmdSub);
	return new Promise((resolve, reject)=>{
		const cmd = spawn.spawn(cmdMain[0], cmdSub);
		cmd.stdout.on('data', (data:string)=>{
			output.push(data);
		});
		cmd.stderr.on('data', (data:string)=>{
			output.push(data);
		})
		cmd.on('close', (code)=>{
			resolve(output);
		});
	})
}
Promise.resolve(init).then((repo:Git.Repository)=>{
	RP = repo;
})

var app = express();
app.get('/', (req: express.Request, res: express.Response) => {
	var commitlist: string = '';
	RP.getBranchCommit('master')
	.then((bcommit:Git.Commit)=>{
		var history = bcommit.history();
		history.on("commit", (commit:Git.Commit) =>{
			// Show the commit sha.
			commitlist +=`<a href="http://localhost:${port}/${commit.sha()}">${commit.sha().slice(0,5)}${commit.date()}${commit.message()}</a><br>`;
		});
		history.on('end', ()=>{
			res.send(commitlist);
		})
		history.start();
	})
});
app.get('/:hash', (req: express.Request, res: express.Response) => {
	RP.getCommit(req.params.hash)
	.then((commit:Git.Commit)=>{
		ckCommit = commit
		console.log('git checkout');
		return Git.Checkout.tree(RP, ckCommit ,{checkoutStrategy:Git.Checkout.STRATEGY.SAFE})
	})
	.then(()=>{
		RP.setHeadDetached(ckCommit.id());
		console.log('build');
		var output:string[]=[];
		return cli(`docker build -f ${target}/Dockerfile -t ${ckCommit.sha().slice(0,5)} ${target}`, output);
	}).then((output:string[])=>{
		console.log('add tag');
		return cli(`docker tag ${ckCommit.sha().slice(0,5)} 127.0.0.1:5000/${ckCommit.sha().slice(0,5)}`, output);
	}).then((output:string[])=>{
		console.log('push');
		return cli(`docker push 127.0.0.1:5000/${ckCommit.sha().slice(0,5)}`, output);
	}).then((output:string[])=>{
		var resdata:string='';
		for(var ln of output){
			resdata += `${ln} <br>`;
		}
		console.log('end process');
		res.send(resdata);
	});
});

// app.get('/:version/:method/:hash', (req: express.Request, res: express.Response) => {
// 	if(req.params.method == 'spin'){
// 		client.get(req.params.hash, (err:Error, data:string)=>{
// 			if(err){
// 				console.error(err);
// 				res.send(err);
// 				return;
// 			}
// 			console.log(data);
// 			if(data == null){
// 				res.send('잘못된 사용자입니다');
// 				return;
// 			}
// 			if(req.params.method == 'spin'){
// 				res.send('돌려라~ '+ data);
// 			} else {
// 				res.send('잘못된 메써드');
// 			}
// 		});
// 	} else if (req.params.method == 'login'){
// 		let id = req.params.hash;
// 		const hash = crypto.createHash('sha256');
// 		hash.update(Date().toString()+id);
// 		let val = hash.digest('hex');
// 		client.set(val, id);
// 		res.send(val);  
// 	} else {
// 		res.send('잘못된 메써드');
// 	}
// });
app.listen(port, ()=>{
	console.log('server ready');
})
