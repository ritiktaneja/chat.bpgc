
var express= require('express');
var app=express();

app.use('/img', express.static('img'));
var server= require('http').createServer(app);

var io= require('socket.io').listen(server);

users=[{
    
        username:'admin',
        status:'1',
        id:'1'
    }];
var i=1;
connections=[];
messagesArray=[{
    'Sender':'',
    'message':''
}];

server.listen(process.env.PORT || 8001);

console.log('Server running...');
app.get('/',function(req,res){
res.sendFile(__dirname+'/index.html');

});



io.sockets.on('connection',function(socket)
{
connections.push(socket);
console.log('Connected: %s sockets connected',connections.length);

//Disconnect
socket.on('disconnect',function(){

    for(i in users)
    {
       
        if(users[i].id==socket.id)
        {  
          users[i].status=0;
        users[i].username="";
        users[i].id=-1;
      }
    }

//users.splice(users.indexOf(socket.username),1);
updateUsernames();

connections.splice(connections.indexOf(socket),1);
console.log('Disconnected: %s sockets connected',connections.length);

});

//Send Message
socket.on('send message',(data)=>{

    messagesArray.push(data);
   
    io.sockets.emit('new message',messagesArray);
  
});

socket.on('verify',(data)=>{
    
    var flag=true;
    var admin=false;
    for(i in users)
    {   
        console.log('##'+users[i].username)
        if(users[i].username.toString().trim() === data.toString().trim())
        {
            socket.emit('duplicate');
           flag=false;
        }

        if(users[i].username.toString().trim() === "569d7dc1611b50e40d5b898c212f4742e3b7d76996bac5d63739fef589f3ccc0")
        admin=true;
    }
    if(admin)
    {
        console.log(admin+"##");
        socket.username=users[0].username;
        socket.status=users[0].status;
        socket.id=users[0].id;
        
        socket.emit('admin');
        updateUsernames();
    }
    else if(flag)
    {   
            
           socket.emit('allowed');
          
    } 
    
});

socket.on('new user',(data,callback)=>{

    if(callback)
    callback(true);
   
    data.id=i++;

    socket.username=data.username;
    socket.status=data.status;
    socket.id=data.id;
    
    users.push(data);
    console.log(data);
    
    updateUsernames();
   

});
socket.on('get chat',(data)=>{
    io.sockets.emit('new message',messagesArray);  

});

    function updateUsernames()
    {

        io.sockets.emit('get users',users);
      
        
    }

});


