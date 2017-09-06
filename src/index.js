import _ from 'lodash';
import io from 'socket.io-client';
import $ from 'jquery';
import bootstrap from 'bootstrap';

function component(val) {
    // var list = document.getElementById('list')
    var element = document.createElement('div');
    element.innerHTML = val;
    return element;
}

function log(val) {
    // var element = document.getElementById('log');
    var div = document.createElement('div');
    div.innerHTML = val;
    return div;
    // element.appendChild(element);
    $('div');
}

var input = document.createElement('div');
input.innerHTML = "<input type=text id='url'/><button onclick='sendurl()'>전송</button>";
document.body.appendChild(input);
var cl = io('127.0.0.1:3000');

cl.on('connect', () => {
    console.log('connected');
})
cl.on('data', (data) => {
    document.getElementById('log').appendChild(log(data));
});

cl.on('repoInit', (data) => {
    document.getElementById('list').innerHTML = data;
});
cl.on('repolist', (data) => {
    document.getElementById('repo').innerHTML = data;
})

window.buildDocker = (hash) => {
    let child = document.getElementsByClassName('log');
    console.log(child.length);
    for (let c of child) {
        console.log(c);
        document.body.removeChild(c);
    }
    console.log('hash', hash);
    cl.emit('build', { 'hash': hash });
}
window.sendurl = () => {
    let url = document.getElementById('url');
    console.log('url', url.value);
    cl.emit('url', url.value);
}
window.loadRepo = (localPath) => {
    cl.emit('loadRepo', localPath);
}