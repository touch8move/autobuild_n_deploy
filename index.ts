import * as express from 'express';
import * as Git from 'nodegit';
// import * as crypto from 'crypto';
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
var RP:Git.Repository;
var ckCommit: Git.Commit;
Git.Repository.open('travis')
.then((repo:Git.Repository)=>{
	RP = repo;
	// return RP.getCommit('ce7822d53e80c76cc2331ac5254762237fbaa018')
});
// .then((commit:Git.Commit)=>{
// 	ckCommit = commit
// 	return Git.Checkout.tree(RP, ckCommit ,{checkoutStrategy:Git.Checkout.STRATEGY.SAFE})
// })
// .then(()=>{
// 	return RP.setHeadDetached(ckCommit.id());
// })
// .then(()=>{
// 	console.log('final~!');
// })
var app = express();

app.get('/:hash', (req: express.Request, res: express.Response) => {
	RP.getCommit(req.params.hash)
	.then((commit:Git.Commit)=>{
		ckCommit = commit
		return Git.Checkout.tree(RP, ckCommit ,{checkoutStrategy:Git.Checkout.STRATEGY.SAFE})
	})
	.then(()=>{
		return RP.setHeadDetached(ckCommit.id());
	})
	.then((num:number)=>{
		// console.log('final~!');
		console.log(num);
		res.send('msg: ' + ckCommit.message() +'  '+ num);
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
app.listen(9000, ()=>{
	console.log('server ready');
})
// Git.Clone.clone("https://github.com/touch8move/travis.git", "./travis");
	// Look up this known commit.
//   .then(function(repo:any) {
//     // Use a known commit sha from this repository.
//     return repo.getCommit("59b20b8d5c6ff8d09518454d4dd8b7b30f095ab5");
//     // console.log(repo);
//   })
	// Look up a specific file within that commit.
//   .then(function(commit:any) {
//     return commit.getEntry("README.md");
//   })
//   // Get the blob contents from the file.
//   .then(function(entry:any) {
//     // Patch the blob to contain a reference to the entry.
//     return entry.getBlob().then(function(blob:any) {
//       blob.entry = entry;
//       return blob;
//     });
//   })
//   // Display information about the blob.
//   .then(function(blob:any) {
//     // Show the path, sha, and filesize in bytes.
//     console.log(blob.entry.path() + blob.entry.sha() + blob.rawsize() + "b");

//     // Show a spacer.
//     console.log(Array(72).join("=") + "\n\n");

//     // Show the entire file.
//     console.log(String(blob));
//   })
//   .catch(function(err:any) { console.log(err); });
// // Open the repository directory.
// Git.Repository.open("tmp")
// // Open the master branch.
// Git.Repository.open('travis')
// Git.Clone.clone('https://github.com/touch8move/travis.git','./travis', {
// 	checkoutBranch: 'master',
// })
// var first = (repo:Git.Repository)=>{
// 	RP = repo;
// 	return repo.getCommit('7238f32b8a50b53cb4a644f03c20a6cc71c560c4')
// }
// var second = (commit:Git.Commit)=>{
// 	ckCommit = commit
// 	return Git.Checkout.tree(RP, ckCommit ,{checkoutStrategy:Git.Checkout.STRATEGY.SAFE})
// }
// var third = ()=>{
// 	return RP.setHeadDetached(ckCommit.id());
// }

// .then((num:number)=>{console.log('num', num)})
// repo.getBranch('refs/remotes/origin/' + branchName)
// .then(function(reference) {
	//checkout branch
	// return repo.checkoutRef(reference);
// });
// .then((repo:Git.Repository) =>{
	// return repo.getCommit('ce7822d53e80c76cc2331ac5254762237fbaa018');
	// return repo.setHead('ce7822d53e80c76cc2331ac5254762237fbaa018');
	// return repo.checkoutRef(repo.getCommit())
	// return repo.getMasterCommit();
	// return repo.getBranchCommit('05eb8');
// })
// Display information about commits on master.
// .then(function(firstCommitOnMaster: Git.Commit) {
// 	// Create a new history event emitter.
// 	var history = firstCommitOnMaster.history();
// 	// Create a counter to only show up to 9 entries.
// 	var count = 0;

// 	// Listen for commit events from the history.
// 	history.on("commit", function(commit:Git.Commit) {
// 		// Disregard commits past 9.
// 		// if (++count >= 9) {
// 		//   return;
// 		// }

// 		// Show the commit sha.
// 		console.log(commit.sha().slice(0,5), commit.date(), commit.message());

// 		// Store the author object.
// 		// var author = commit.author();

// 		// Display author information.
// 		// console.log("Author:\t" + author.name() + " <" + author.email() + ">");

// 		// Show the commit date.
// 		// console.log("Date:\t" + commit.date());

// 		// Give some space and show the message.
// 		// console.log("\n    " + );
// 	});
// 	history.start();
// //   history.start();
// //   history.emit('commit');
// //   history.start
// 	// Start emitting events.
// //   history.start();
// });

// .then((commit: Git.Commit)=>{
// 	console.log(commit.message());
// })
