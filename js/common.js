var HttpUrl = "http://hyperf-base.com/";
var token = '';
var userInfo = '';
var websocket = null;
//当前的聊天对象ID，  0为大厅 
var currentFriendId = 0;
var chatRecord= new Array();
// 当前聊天对象
var currentChatUser= {
	friend_id:0,
	nickname:'',
	avatar:''
};

// 注册
$("#registerForm").submit(function(){
	console.log($(this).serialize());
	var mobile = $("input[name=mobile]").val();
	var checkMobile = /^(((13[0-9]{1})|(14[0-9]{1})|(17[0]{1})|(15[0-3]{1})|(15[5-9]{1})|(18[0-9]{1}))\d{8})$/;   
	if(mobile == '') {
		alert("请输入手机号");return false;
	}
	if(mobile.length !=11 || !checkMobile.test(mobile)){
		alert("手机号格式不正确");return false;
	}
	if($("input[name=nickname]").val() == '') {
		alert("请输入昵称");return false;
	}
	if($("input[name=password]").val() == '') {
		alert("请输入密码");return false;
	}
	if($("input[name=password]").val().length <6) {
		alert("密码不能少于6位数");return false;
	}
	if($("input[name=password2]").val() == '' || $("input[name=password2]").val()!=$("input[name=password]").val()) {
		alert("确认密码不正确");return false;
	}
	$.ajax({  
        type: "post",  
        url: HttpUrl+"register",  
        data: $(this).serialize(),  
		async:false,
        dataType:"json",  
        beforeSend: function(){  
           $("#registerBut").attr("disabled","disabled");
        },  
        success:function(e){  
			console.log(e);
			if(e.code==0){
				alert('注册成功');
				window.location="login.html"
				return false;
			}else{
				alert(e.msg);
				$("#registerBut").removeAttr("disabled");
			}
        },
		error:function(){
			alert('登录请求失败');
			$("#registerBut").removeAttr("disabled");
		}
  
    }); 
	return false;
});
// 登录
$("#loginForm").submit(function(e){
	var mobile = $("input[name=mobile]").val();
	var password = $("input[name=password]").val();
	// 判断手机号码
	if (mobile=='') { 
		alert('手机号没有输入');
		$('#mobile').focus();
		return false;
	} else {
		var checkMobile = /^(((13[0-9]{1})|(14[0-9]{1})|(17[0]{1})|(15[0-3]{1})|(15[5-9]{1})|(18[0-9]{1}))\d{8})$/;   
		if(checkMobile.test(mobile) == false) {
			alert('手机号码不正确');
			$('#mobile').focus();
			return false;
		}
	}
	if (password=='') { 
		alert('请输入您的密码');
		$('#nickname').focus();
		return false;
	}
	
	$.ajax({  
        type: "post",  
        url: HttpUrl+"login",  
        data: $(this).serialize(),  
		async:false,
        dataType:"json",  
		beforeSend: function(){  
			$("#loginBut").attr("disabled","disabled");
		}, 
        success:function(e){  
			console.log(e);
			if(e.code==0){
				console.log(JSON.stringify(e.data));
				var res = $.cookie('userInfo', JSON.stringify(e.data));
				console.log(res);
				alert('登录成功');
				window.location="index.html";
				
				return false;
			}else{
				alert(e.msg);
				$("#loginBut").removeAttr("disabled");
			}
        },
		error:function(){
			alert('登录请求失败');
			$("#loginBut").removeAttr("disabled");
		}
  
    });  
	return false;
});

function checkLogin(){
	console.log( $.cookie('userInfo'));
	if($.cookie('userInfo') == null || $.cookie('userInfo') == 'null' || $.cookie('userInfo') == undefined){
		alert("请先登录");
		window.location="login.html";
		return false;
	}
	userInfo = JSON.parse($.cookie('userInfo'));
	console.log(userInfo);
	token = userInfo.token;
	$(".own_head").css('background-image',"url("+HttpUrl+userInfo.avatar+")");
	$(".own_name").html(userInfo.nickname);
	$(".own_numb").html("手机号："+userInfo.mobile);
	$("#ownHeadImg").attr("src", HttpUrl+userInfo.avatar)
	
	var html = "";
	html += '<li data-id="0" class="user_active"  id="all">';
	html += '	<div class="user_head"><img src="images/all-user-head.jpg"/></div>';
	html += '	<div class="user_text">';
	html += '		<p class="user_name">聊天大厅</p>';
	html += '		<p class="user_message">...</p>';
	html += '	</div>';
	html += '	<div class="user_time"> </div>';
	html += '	<span class="red"></span>';
	html += '</li>';
	if(userInfo.friends.length > 0){
		for(var i=0;i<userInfo.friends.length; i++){
			var friend = userInfo.friends[i];
			html += '<li data-id="'+friend.id+'" class="user_'+friend.id+'">';
			html += '	<div class="user_head"><img src="'+HttpUrl+friend.avatar+'"/></div>';
			html += '	<div class="user_text">';
			html += '		<p class="user_name">'+friend.nickname+'</p>';
			html += '		<p class="user_message">...</p>';
			html += '	</div>';
			html += '	<div class="user_time"> </div>';
			html += '	<span class="red"></span>';
			html += '</li>';
		}
	}
	$(".office_text .user_list").html(html);

	// 开始连接websocker
	openWs();
}

// 开始连接websocker
function openWs(){
	console.log("开始连接websocker");
	var wsServer = 'ws://hyperf-base.com/ws/?token='+token;
	websocket = new WebSocket(wsServer);
	websocket.onopen = function (evt) {
		console.log("服务器连接成功，进入用户列表");
		//获取用户列表
	};

	websocket.onclose = function (evt) {
		alert('连接已关闭');
		console.log("连接已关闭");
		websocket = null;
		Window.location="login.html";
	};

	websocket.onmessage = function (evt) {
		var returnData = JSON.parse(evt.data);
		if(returnData.code != 0){
			alert(returnData.msg);
			if(returnData.code == 1000){	//未登录
				$.cookie("userInfo",null);
				window.location="login.html";
			}
			return false;
		}
		
		// 好友发消息来
		if(returnData.type == 0 || returnData.type==1){
			friendMsg(returnData);
		}
		
		// console.log('Retrieved data from server: ' + evt.data);
	};

	websocket.onerror = function (evt, e) {
		// console.log(evt);
		// console.log(e);
		console.log('Error occured: ' + evt.type);
	};
	
	// 定时器，心跳发送
	setInterval(sendWs,30000);
}

// 心跳续命
function sendWs(){
	if(websocket != null){
		websocket.send('Live');
	}
}

//获取当前时间格式
function getTime(time=null){
	var myDate = new Date(time);
	
	var y = myDate.getFullYear();
	var m = myDate.getMonth()+1;
	var d = myDate.getDate();

	var h = myDate.getHours();//获取当前小时数(0-23)
	var m = myDate.getMinutes();//获取当前分钟数(0-59)
	var s = myDate.getSeconds();//获取当前秒



	return h+':'+m+':'+s;
}

//发送消息
$("#cententForm").submit(function(e){
	var msg = $("#input_box").val();
	if(msg == '' || msg==' ' || msg=="\n"){
		alert('请输入内容');
		return false;
	}

	msg = msg.replace(/[\r\n]/g, '');
	var timestamp = Date.parse(new Date())/1000;
	var url = HttpUrl+"index/User/chat";
	
	var data = {'type':0, 'content':msg, 'friend_id':currentChatUser.friend_id, 'time':timestamp, 'token':token};
	if(websocket != null){
		websocket.send(JSON.stringify(data));
	}

	if(currentChatUser.friend_id!= 0){	//与好友聊天
		//判断是否已有聊天记录
		if(!chatRecord.hasOwnProperty(data.friend_id)){	//不存在
			chatRecord[data.friend_id] = new Array();
		}
		chatRecord[data.friend_id].push({obj:userInfo.id,avatar:userInfo.avatar, nickname:userInfo.nickname, content:msg, time:timestamp});
		var html = msgTemplate(0, userInfo.avatar, userInfo.nickname, msg, timestamp);
		$("#chatbox").append(html);
		$(".windows_body .office_text").scrollTop($(".windows_body .office_text")[0].scrollHeight);
	}

	$("#input_box").val('');
	$("#chatbox").scrollTop=$("#chatbox").scrollHeight;
	return false;
});

//好友消息处理
function friendMsg(data){
	if(data.type==0){	// 大厅消息
		if(currentChatUser.friend_id==0){
			var obj = data.form_id==userInfo.id?0:1;
			var html = msgTemplate(obj, data.form_avatar, data.form_nickname, data.content, data.time);
			$("#chatbox").append(html);
			$(".windows_body .office_text").scrollTop($(".windows_body .office_text")[0].scrollHeight);
		}else{
			$("#all .red").show();
		}
		
		// 更新聊天列表里的最后一条信息
		$("#all .user_message").html(data.content);
	}else{// 私聊消息  都是别人发过来的信息
		if(currentChatUser.friend_id == data.form_id){
			var html = msgTemplate(1, data.form_avatar, data.form_nickname, data.content, data.time);
			$("#chatbox").append(html);
			$(".windows_body .office_text").scrollTop($(".windows_body .office_text")[0].scrollHeight);
		}else{
			$(".user_"+data.form_id+" .red").show();
		}
		
		$(".user_"+data.form_id+" .user_message").html(data.content);
	}
	
	if(data.type == 0){
		//判断是否已有聊天记录
		if(!chatRecord.hasOwnProperty(0)){	//不存在
			chatRecord[0] = new Array();
		}
		chatRecord[0].push({obj:data.form_id ,avatar:data.form_avatar, nickname:data.form_nickname, content:data.content,time:data.time});
	}else{
		//判断是否已有聊天记录
		if(!chatRecord.hasOwnProperty(data.form_id)){	//不存在
			chatRecord[data.form_id] = new Array();
		}
		chatRecord[data.form_id].push({obj:data.form_id,avatar:data.form_avatar, nickname:data.form_nickname, content:data.content,time:data.time});
	}
}


/**
 *聊天消息模板处理
 * param obj	对象，0自己  1好友
 * param head_img	头像
 * param nickname	昵称
 * param content	内容
 * param time		时间
 * return string
 **/
 function msgTemplate(obj, head_img, nickname, content, time){
	var html = "";
	if(obj == 1){
		html	+= '<li class="other">';
		html	+= '	<img src="'+HttpUrl+head_img+'" title="'+nickname+'"><span>'+content+'</span>';
		html	+= '</li>';
	}else{
		html	+= '<li class="me">';
		html	+= '	<img src="'+HttpUrl+head_img+'" title="'+nickname+'"><span>'+content+'</span>';
		html	+= '</li>';
	}
	return html;
}


//点击好友进入对话框
$(".office_text").on("click", "li", function(e){
	var friend_id = $(this).context.dataset.id;
	if(friend_id == currentChatUser.friend_id){
		return false;
	}
	var avatar = $(this).find(".user_head").find('img').attr('src');
	var nickname = $(this).find(".user_name").html();
	currentChatUser.friend_id = friend_id;
	currentChatUser.avatar = avatar;
	currentChatUser.nickname = nickname;
	
	$(".windows_top_box .user-name").html(nickname);
	$(this).find('.red').hide();
	$(".user_list li").removeClass('user_active');
	$(this).addClass('user_active');
	
	//清空之前的聊天记录
	$("#chatbox").html('');
	
	//判断与该好友是否有聊天记录, 存在的话，输出聊天记录
	if(chatRecord.hasOwnProperty(currentChatUser.friend_id)){	//存在
		var html = '';
		for (var i in chatRecord[currentChatUser.friend_id]) {
			// console.log(chatRecord[currentChatUser.friend_id][i]);
			var userData = chatRecord[currentChatUser.friend_id][i];
			var obj = userData.obj==userInfo.id?0:1;
			html += msgTemplate(obj, userData.avatar, userData.nickname, userData.content, userData.time);
		}
		$("#chatbox").html(html);
	}
	$("#input_box").focus();
	
	$(".windows_body .office_text").scrollTop($(".windows_body .office_text")[0].scrollHeight);
});