
var express= require('express');
var app=express();

app.use('/img', express.static('img'));
var server= require('http').createServer(app);

var io= require('socket.io').listen(server);

users=[{
    
        username:'admin',
        status:'1',
        id:'1',
        ip:''
    }];
connections=[];
messagesArray=[{
    'Sender':'',
    'message':'',
    'private':false
}];

server.listen(process.env.PORT || 80);

console.log('Server running...');
app.get('/',function(req,res){
res.sendFile(__dirname+'/index.html');

});

app.get('/private',function(req,res)
{
   res.sendFile(__dirname+'/private.html'); 
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
        users[i].ip=-1;
      }
    }

//users.splice(users.indexOf(socket.username),1);
updateUsernames();

connections.splice(connections.indexOf(socket),1);
console.log('Disconnected: %s sockets connected',connections.length);

});

//Send Message
socket.on('send message',(data,callback)=>{
    data.message=data.message.trim();
    
    if(data.message.substr(0,3) === '/w ')
    {
        data.message=data.message.substr(3);
        
        var ind = data.message.indexOf(' ');
        if(ind !== -1)
        {
            var name=data.message.substring(0,ind);
            data.message=data.message.substring(ind+1);
            console.log("PM USER 2: "+name);
            var checkuser=true;
            for( i in users)
            {
                if(name === users[i].username)
                {
                    data.private=true;
                
                    io.to(socket.id).emit('whisper',data);
                    io.to(users[i].id).emit('whisper',data);
                    
                    console.log('Whisper');
                    checkuser=false;
                    break;
                }
               
            }
            if(checkuser)
            {
                callback('Enter a valid user name');
                socket.emit('response',{'sender':'admin','private':true,'error':false,'message':'No such user exist!'});
               
                console.log('user unavailable');
            }

        }
        else{
                socket.emit('response',{'sender':'admin','private':true,'error':false,'message':'Please Enter a message for your whisper'});
            callback('Error! Please Enter a message for your whisper');
        }
    }
    else if(data.message.substr(0,7) === '/block ')
    {
        data.message=data.message.substr(7);
        
       
            var name=data.message;
            
           if(name === socket.username)
           {
               callback('Don\'t block yourself');
           }
           else
           {
                var checkuser=true;
                for( i in users)
                {
                    if(name === users[i].username)
                    {
                        console.log(name+' blocked by '+socket.username);
                        socket.emit('block user',users[i])
                        checkuser=false;
                        socket.emit('response',{'sender':'admin','private':true,'error':false,'message':name+' blocked'});
                    }
                
                }
                if(checkuser)
                {
                    socket.emit('response',{'sender':'admin','private':true,'error':false,'message':'No such active user exist!'});
                    callback('Enter a valid user name');
                }
            }

        
       
    }

    else if(data.message.substr(0,11) === '/hide group')
    {
       
        socket.emit('group toggle',false);  
        socket.emit('response',{'sender':'admin','private':true,'error':false,'message':'Group messages hidden'});
    }
    else if(data.message.substr(0,11) === '/show group')
    {
       
        socket.emit('group toggle',true);  
        socket.emit('response',{'sender':'admin','private':true,'error':false,'message':'Group messages Shown'});
    }

    

    

    else
    {
    data.private=false;
    messagesArray.push(data);
    io.sockets.emit('new message',messagesArray);
    }
  
});

socket.on('verify',(data)=>{
    
    var flag=true;
    var admin=false;
    for(i in users)
    {   
        console.log(users[i].username)
        if(users[i].username.toString().trim() === data.toString().trim())
        {
            socket.emit('duplicate',{'message':'Nick Already exists!'});
           flag=false;
        }
        var ip = socket.handshake.address;
        if(users[i].ip.toString().trim() === ip.toString().trim())
        {
           socket.emit('duplicate',{'message': 'ChatApp is already open in another tab or browser!'});
           flag=false;
        }


        //if(users[i].username.toString().trim() === "569d7dc1611b50e40d5b898c212f4742e3b7d76996bac5d63739fef589f3ccc0")
       // admin=true;
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
   
    var ip = socket.handshake.address;
    data.ip=ip;
    socket.username=data.username;
    socket.status=data.status;
    data.id=socket.id;
    socket.ip=data.ip;
    
    users.push(data);
    console.log(data);
    
    updateUsernames();
   

});
socket.on('get chat',(data)=>{
    io.sockets.emit('new message',messagesArray);  

});
// socket.on('requestPM',(user2)=>
// {
//     console.log("USER2 id : ",user2.id);
//     var uniqueid=socket.id+user2.id.toString().trim();
//     socket.join(uniqueid);
//     socket.emit('open tab',uniqueid);
   
//     socket.broadcast.to(uniqueid).emit('private message','blah');
   
    
    
// });

    function updateUsernames()
    {

        io.sockets.emit('get users',users);
      
        
    }

});


