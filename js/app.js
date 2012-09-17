// author: igor almeida
// since: 02-2012
// version 1.2
var app =
{
	  login_url  : "/login"
	, delete_url : "/delete"
	, fetch_url  : "/fetch"
	, enc_credencial : ""

	, messages :
	{
		step1 : {
			  invalid : "Check the username and password."
			, system_error : "Error connecting to server. Try again later."
			, connecting_api : "Connecting to server."
			, service_error : "Service error. try again later!"
			, parse_error : "Seems that Deliciou's API has changed. The xml can't be parsed properly. Try again later!"
			, api_error : "Seems that Deliciou's API is offline.Try again later!"
			, label_login : "Login"
			, label_connecting : "Conecting"
			, label_logout: "Logout"
			, hello: "Hello "
		}
		, step2 : {
			  api_result : "We have {total} urls to test."
			, status_count : "{number} urls found."
			, service_error : "Service error. try again later!"
			, done : "done!"
			, label_inspect : "Inspect"
			, label_stop : "Stop"
			, label_done : "Done"
		}
		
		, step3 : {
			  delete_success : "Register deleted."
			, delete_error : "Error:"
			, delete_complete : "Nothing to delete."
			, label_delete_all : "Delete all."
			, label_stop_deleting : "Stop!"
			, label_nothing : "Done!"
		}
	}

	, dom : {
		  step1 : {}
		, step2 : {}
		, step3 : {}
 	}

	, init: function( )
	{
		// reseting values
		app.urls	= [ ];
		app.url_ok	= [ ];
		app.url_nok	= [ ];
		app.url_index	= 0;
		app.is_paused  = true;
		app.loginstatus = undefined;

		app.trigged_delete = undefined;
		app.is_deleting_all = false;

		// getting DOM objects

		// step1
		app.dom.step1.div		= $("#step1");
		app.dom.step1.user		= $("#delicious_user");
		app.dom.step1.pass		= $("#delicious_pass");
		app.dom.step1.status	= $("#login_status");
		app.dom.step1.btn		= $("#btn_login");
		app.dom.step1.user_name = $("#delicious_name");
		app.dom.step1.form		= $("#frm_login");
		app.dom.step1.fields	= $("#frm_login fieldset");

		// step2
		app.dom.step2.div		= $("#step2");
		app.dom.step2.status	= $("#inspection_status");
		app.dom.step2.btn		= $("#btn_inspect");
		app.dom.step2.progerss	= $("#progress_bar");
		app.dom.step2.total		= $("#items_found");
		app.dom.step2.count		= $("#count");
		app.dom.step2.url		= $("#current_url");
		app.dom.step2.ok		= $("#uok");
		app.dom.step2.nok		= $("#unok");

		app.dom.step3.div		= $("#step3");
		app.dom.step3.list		= $("#list");
		app.dom.step3.status	= $("#delete_status");
		app.dom.step3.btn		= $("#btn_delete_all");

		// resting DOM states.
		app.login_btn_state("login");
		app.inspect_btn_state("inspect");
		app.delete_btn_state("delete all");

		// cleanup status
		app.dom.step1.user.parent().removeClass("error");
		app.dom.step1.pass.parent().removeClass("error");

		app.dom.step1.form.unbind("submit").bind("submit", function(e){
			e.preventDefault();
			if (app.loginstatus == "logout" ){
				app.logout();
			}
			else if (app.loginstatus == "login"){
				app.login();
			}
		});

		// cleanup status messages
		app.login_status(undefined);

		app.hide_step2();
		app.hide_step3();
	}
	
	, login_btn_state: function( state )
	{
		app.loginstatus = state;
		switch( state )
		{
			case "logout":
				app.dom.step1.btn.removeClass("active btn-primary").addClass("btn-danger");
				app.dom.step1.btn.val( app.messages.step1.label_logout );
			break;
			case "connecting":
				app.dom.step1.btn.addClass( "active" );
				app.dom.step1.btn.val( app.messages.step1.label_connecting );
			break;
			default:
				app.dom.step1.btn.removeClass("active btn-danger").addClass("btn-primary");
				app.dom.step1.btn.val( app.messages.step1.label_login );
			break;
		}
	}
	
	, login_status: function( msg, style) 
	{
		if (msg==undefined){
			app.dom.step1.status.text("").fadeOut();
			return
		}
		app.dom.step1.status.removeClass().addClass("show alert "+style).text(msg).fadeIn();
	}

	, login: function( data )
	{
		// empty login
		if ( app.dom.step1.user.val().length==0) {
			app.dom.step1.user.parent().addClass("error");
			app.login_status( app.messages.step1.invalid , "alert-error" );
			return;
		}
		app.dom.step1.user.parent().removeClass("error");

		if (app.dom.step1.pass.val().length==0 ){
			app.dom.step1.pass.parent().addClass("error");
			app.login_status( app.messages.step1.invalid , "alert-error" );
			return;
		}
		app.dom.step1.pass.parent().removeClass("error");
		

		app.login_btn_state("connecting");

		// + DEBUG
		// app.show_step2(100);
		// return
		// - DEBUG
		
		app.login_status(app.messages.step1.connecting_api, "alert-info");

		_gaq.push(['_trackEvent', 'step1', 'login', 'click']);

		app.enc_credencial = Base64.encode(app.dom.step1.user.val()+":"+app.dom.step1.pass.val());

		app.dom.step1.user.val("");
		app.dom.step1.pass.val("");
		app.fetch_bookmark();
	}
	
	, fetch_bookmark : function ( )
	{
		var form_data = {
			credencials:app.enc_credencial
			, start:app.urls.length
		};

		$.ajax( {
			  url: app.login_url
			, type: "POST"
			, data: form_data
			, dataType:"json"
			, success : app.handle_login_parse
			, error: app.handle_login_error
		} );
	}

	, logout: function()
	{
		// resetting remaining credencials.
		app.enc_credencial = null;
		app.dom.step1.user_name.text("").fadeOut();
		app.dom.step1.fields.fadeIn();
		app.dom.step1.user.val("");
		app.dom.step1.pass.val("");
		app.init();
	}

	, handle_login_error:function(data)
	{
		_gaq.push(['_trackEvent', 'step1', 'login', 'error']);
		app.login_status(app.messages.step1.system_error,"alert-error");
	}

	, handle_login_parse:function( data )
	{
		if (data ==undefined || data.result == undefined || data.status_code != 0 ){
			_gaq.push(['_trackEvent', 'step1', 'login', 'error']);
			app.login_status( data.message || app.messages.step1.service_error, "alert-error" );
			app.login_btn_state("login");
			return;
		}

		try{
			var xmlDoc = $.parseXML( data.result );
		    var xml = $( xmlDoc );	
		}
		catch(err)
		{
			_gaq.push(['_trackEvent', 'step1', 'login', 'error']);
			app.login_status( app.messages.step1.api_error, "alert-error" );
			app.login_btn_state("login");
			return;
		}

		var result_node  = xml.find( "result" ).get(0);
		if ( result_node != undefined ){
			app.login_status( $(result_node).attr("code") ? ("Delious API says: "+$(result_node).attr("code")) : app.messages.step1.parse_error, "alert-error" );
			app.login_btn_state("login");
			return;
		}

		var posts = xml.find("posts").get(0);
		if ( posts == undefined ){
			app.login_status( app.messages.step1.parse_error, "alert-error" );
			app.login_btn_state("login");
			return;
		}

		app.dom.step1.fields.fadeOut();
		app.dom.step1.user_name.text( app.messages.step1.hello + $(posts).attr("user")).fadeIn();

		$(posts).find("post").map(function(value){
			app.urls.push($(this).get(0));
		});

		var total = $(posts).attr("total") || app.urls.length;
		if ( app.urls.length < total){
			app.fetch_bookmark();
		}
		else
		{
			_gaq.push(['_trackEvent', 'step1', 'login', 'success']);
			app.show_step2( app.urls.length );
			app.login_btn_state("logout");
			app.login_status( undefined );
		}
	}
	
	, inspect_status: function( msg, style) 
	{
		if (msg==undefined){
			app.dom.step2.status.removeClass().addClass("label ").text("").hide();
			return;
		}
		app.dom.step2.status.removeClass().addClass("label "+(style||" ")).text(msg).show();
	}
	
	, show_step2 : function ( total )
	{
		app.update_count();
		var msg = app.messages.step2.api_result.replace("{total}",total);
		app.dom.step2.total.text( msg );
		app.dom.step2.div.removeClass("hidden").fadeIn("slow");
	}

	, hide_step2 : function ( total )
	{
		app.stop_inspection( );
		app.inspect_status( undefined );
		app.dom.step2.div.fadeOut( );

		app.update_count();

		var msg = app.messages.step2.api_result.replace("{total}",0);
		app.dom.step2.total.text( msg );
	}
	
	, update_count: function ()
	{
		app.dom.step2.ok.text( app.messages.step2.status_count.replace("{number}",app.url_ok.length) );
		app.dom.step2.nok.text( app.messages.step2.status_count.replace("{number}",app.url_nok.length) );

		var width = Math.min(Math.round(app.url_index/app.urls.length*100),100);
			width = Math.max(0,width);

		app.dom.step2.progerss.width( width + "%" );

		app.dom.step2.count.text(app.url_index+" / "+app.urls.length)
	}

	, inspect_btn_state: function( state )
	{
		switch( state )
		{
			case "stop":
				app.dom.step2.btn.removeClass( "btn-primary" ).addClass("btn-danger");
				app.dom.step2.btn.unbind( "click" ).click(app.stop_inspection);
				app.dom.step2.btn.val( app.messages.step2.label_stop );
			break;
			case "done":
				app.dom.step2.btn.removeClass( "btn-primary btn-danger" ).addClass("btn-success active");
				app.dom.step2.btn.unbind( "click" );
				app.dom.step2.btn.val( app.messages.step2.label_done );
			break;
			default:
				app.dom.step2.btn.removeClass( "btn-danger" ).addClass("btn-primary");
				app.dom.step2.btn.unbind( "click" ).click(app.start_inspection);
				app.dom.step2.btn.val( app.messages.step2.label_inspect );
			break;
		}
	}

	, stop_inspection: function( )
	{
		app.is_paused = true;
		app.inspect_btn_state( "inspect" );
	}

	, start_inspection: function( )
	{
		_gaq.push(['_trackEvent', 'step2', 'inspect', app.urls.length]);
		app.is_paused = false;
		app.inspect_btn_state( "stop" );
		app.fetch_next( );
	}

	, fetch_next : function ( )
	{
		app.update_count( );

		// halt there!
		if (app.is_paused){
			return;
		}

		//  all done!
		if (app.url_index==app.urls.length)
		{
			app.inspect_btn_state("done");
			app.inspect_status( undefined );
			app.show_step3( );
			return;
		}

		var url = $(app.urls[app.url_index]).attr("href");
		if (/^.+(?=#)/.test(url)) {
			url = url.match(/^.+(?=#)/)[0];
		}
		app.dom.step2.url.text(url);
	
		$.ajax({
			  url : app.fetch_url
			, data: {url:url}
			, type: "POST"
			, dataType: "json"
			, success : app.parse_status_code
			, error : function(err){
				app.inspect_status( app.messages.step2.service_error, "alert-error" );
				app.stop_inspection();
			}
		});
	}

	, parse_status_code : function( data )
	{
		var errors = [-4,-5,-100,400,401,402,404,501,503];

		if (errors.indexOf(data.status_code)!=-1)
		{
			if (console!=undefined && typeof console.info == "function" ){
				console.info(data);	
			}
			app.url_nok.push( app.urls[app.url_index] );
			app.add_url_error( app.urls[app.url_index] );
			app.inspect_status( "error", "alert-error" );
			app.url_index++;
			app.fetch_next();
		}
		else
		{
			app.url_ok.push( app.urls[app.url_index] );
			app.url_index++;
			app.inspect_status( "ok" , "alert-success" );
			app.fetch_next();
		}
	}

	, hide_step3 : function( )
	{
		app.delete_status( undefined );
		app.stop_deleting( );
		app.dom.step3.list.find("div").each(function(index){
			$(this).detach();
		});
		app.dom.step3.div.fadeOut();
	}

	, show_step3 : function( )
	{
		app.inspect_status(undefined);
		if (app.dom.step3.list.find("div").length==0){
			app.delete_status( app.messages.step3.delete_complete, "label-info" );
			app.delete_btn_state("none");
		}else{
			app.dom.step3.div.fadeIn("slow");
		}
	}

	, add_url_error : function( data )
	{
		var template =  "<div class=\"well well-compact\">"
			template += "<span></span><br />"
			template += "<a href=\"#\" class=\"btn btn-mini btn-warning\" target=\"_blank\">try it</a> "
			template += "<a href=\"#\" class=\"btn btn-mini btn-success\" title=\"Keep on delicious but remove from this list.\">ignore</a> "
			template += "<a href=\"#\" class=\"btn btn-mini btn-info\">details</a> "
			template += "<a href=\"#\" class=\"btn btn-mini btn-danger\">delete</a> "
			template += "<br /> "
			template += "</div>"

		var index = app.dom.step3.list.find("div").length;

		var node = $(template);
			node.attr("id","id-"+index);

		var value = {
			  xml	: data
			, index : index
			, node	: node
		};

		var xml_url	= $(data).attr("href");
		var node_span = node.find("span");
			node_span.text( xml_url );

		var node_detail = node.find("a.btn-info");
			node_detail.click( value, app.detail_item);

		var node_delete = node.find("a.btn-danger");
			node_delete.click( value, app.delete_item);

		var node_ignore = node.find("a.btn-success");
			node_ignore.click( value, function(value){
				value.data.node.detach();
			});

		var node_try = node.find("a.btn-warning");
			node_try.attr("href",xml_url);

		app.dom.step3.list.append( node );
		app.delete_status( undefined );
	}
	
	, detail_item : function( value )
	{
		var details = value.data.node.find("div");

		if ( details.length>0 )
		{
			details.detach( );
		}
		else
		{
			var desc = "<strong>Description:</strong> " + $( value.data.xml ).attr("description");
				desc += "<br />";
				desc += $( value.data.xml ).attr("extended");
				desc += "<br />";
				desc += "<strong>Tags:</strong> " + $( value.data.xml ).attr("tag");
				desc += "<br />";
				desc += "<strong>Time:</strong> "+ $( value.data.xml ).attr("time");

			value.data.node.append("<div class=\"alert alert-compact\">"+desc+"</div>");	
		}
	}
	
	, delete_btn_state: function( state )
	{
		switch( state )
		{
			case "stop":
				app.is_deleting_all = true;
				app.dom.step3.btn.unbind( "click" ).click(app.stop_deleting);
				app.dom.step3.btn.val( app.messages.step3.label_stop_deleting ).show();
			break;
			case "none":
				app.is_deleting_all = false;
				app.dom.step3.btn.unbind( "click" )
				app.dom.step3.btn.val( app.messages.step3.label_nothing );
				app.dom.step3.btn.hide();
			break;
			default:
				app.is_deleting_all = false;
				app.dom.step3.btn.unbind( "click" ).click(app.delete_all);
				app.dom.step3.btn.val( app.messages.step3.label_delete_all ).show();
			break;
		}
	}

	, delete_status: function( msg, style) 
	{
		if (msg==undefined){
			app.dom.step3.status.removeClass().addClass("label label-info").text("").hide()
			return;
		}
		app.dom.step3.status.removeClass().addClass("label "+style).text(msg).show();
	}
	
	, delete_item : function( event )
	{
		if( (event.originalEvent !=undefined && app.is_deleting_all==true) || app.trigged_delete!=undefined ){
			// avoid delete during 'delete all'.
			return;
		}

		app.trigged_delete = event.data;
		app.trigged_delete.node.fadeTo( "slow", 0.5 );
		$(this).unbind("click");

		var form_data = {
			  url		: $( event.data.xml ).attr("href")
			, credencials: app.enc_credencial
		};

		// + DEBUG
		// app.handle_delete_result();
		// return;
		// - DEBUG

		_gaq.push(['_trackEvent', 'step3', 'delete', ""]);

		// calling server for login
		$.ajax( {
			  url: app.delete_url
			, type: "POST"
			, data: form_data
			, dataType:"json"
			, success : app.handle_delete_result
			, error: app.handle_delete_error
		} );
	}
	
	, handle_delete_error : function (err)
	{
		app.delete_status(app.messages.step1.system_error,"label-error");
		app.stop_deleting();
	}

	, handle_delete_result : function( data )
	{
		if (data == undefined || data.result == undefined || data.status_code != 0 ){
			app.delete_status( data.message || app.messages.step1.service_error, "label-important" );
			app.trigged_delete = undefined;
			app.stop_deleting();
			return;
		}

		try{
			var xmlDoc = $.parseXML( data.result );
		    var xml = $( xmlDoc );
			var result_node  = xml.find( "result" ).get(0);
			if (result_node==undefined){
				throw new Error("impossible to parse result");
			}
			var code = $(result_node).attr("code");
		}
		catch( err )
		{
			app.delete_status( app.messages.step1.api_error, "label-important" );
			app.trigged_delete = undefined;
			app.stop_deleting();
			return;
		}

		if ( code == "done" )
		{
			app.delete_status( app.messages.step3.delete_success , "label-success" );
			app.trigged_delete.node.fadeOut( function( ) {
				$(this).detach( );
				app.trigged_delete = undefined;
				app.delete_next();
			});
		}
		else
		{
			app.delete_status( app.messages.step3.delete_error + " " + code , "label-important" );
			app.trigged_delete.node.find("strong").before("<p><span class=\"label label-important\">"+code+"</span></p>");
			app.trigged_delete = undefined;
			app.delete_next();
		}
	}
	
	, delete_all : function ( )
	{
		app.delete_btn_state("stop");
		app.delete_next();
	}
	
	, delete_next : function( )
	{
		var divs = app.dom.step3.list.find("div");
		if (divs.length==0){
			app.stop_deleting();
			app.delete_status( app.messages.step3.delete_complete, "label-info" );
			app.delete_btn_state("none");
			return;
		}
		app.dom.step3.status.fadeOut();
		if (app.is_deleting_all==true){
			$(divs[0]).find("a.btn-danger").trigger('click');
		}
	}

	, stop_deleting : function ( )
	{
		app.delete_btn_state("delete all");
		app.trigged_delete = undefined;
	}
}

var Base64 = {
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode : function (input) {
	    var output = "";
	    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	    var i = 0;

	    input = Base64._utf8_encode(input);

	    while (i < input.length) {

	        chr1 = input.charCodeAt(i++);
	        chr2 = input.charCodeAt(i++);
	        chr3 = input.charCodeAt(i++);

	        enc1 = chr1 >> 2;
	        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
	        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
	        enc4 = chr3 & 63;

	        if (isNaN(chr2)) {
	            enc3 = enc4 = 64;
	        } else if (isNaN(chr3)) {
	            enc4 = 64;
	        }

	        output = output +
	        Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2) +
	        Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);

	    }

	    return output;
	},

	// public method for decoding
	decode : function (input) {
	    var output = "";
	    var chr1, chr2, chr3;
	    var enc1, enc2, enc3, enc4;
	    var i = 0;

	    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

	    while (i < input.length) {

	        enc1 = Base64._keyStr.indexOf(input.charAt(i++));
	        enc2 = Base64._keyStr.indexOf(input.charAt(i++));
	        enc3 = Base64._keyStr.indexOf(input.charAt(i++));
	        enc4 = Base64._keyStr.indexOf(input.charAt(i++));

	        chr1 = (enc1 << 2) | (enc2 >> 4);
	        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
	        chr3 = ((enc3 & 3) << 6) | enc4;

	        output = output + String.fromCharCode(chr1);

	        if (enc3 != 64) {
	            output = output + String.fromCharCode(chr2);
	        }
	        if (enc4 != 64) {
	            output = output + String.fromCharCode(chr3);
	        }

	    }

	    output = Base64._utf8_decode(output);

	    return output;

	},

	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
	    string = string.replace(/\r\n/g,"\n");
	    var utftext = "";

	    for (var n = 0; n < string.length; n++) {

	        var c = string.charCodeAt(n);

	        if (c < 128) {
	            utftext += String.fromCharCode(c);
	        }
	        else if((c > 127) && (c < 2048)) {
	            utftext += String.fromCharCode((c >> 6) | 192);
	            utftext += String.fromCharCode((c & 63) | 128);
	        }
	        else {
	            utftext += String.fromCharCode((c >> 12) | 224);
	            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
	            utftext += String.fromCharCode((c & 63) | 128);
	        }

	    }

	    return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
	    var string = "";
	    var i = 0;
	    var c = c1 = c2 = 0;

	    while ( i < utftext.length ) {

	        c = utftext.charCodeAt(i);

	        if (c < 128) {
	            string += String.fromCharCode(c);
	            i++;
	        }
	        else if((c > 191) && (c < 224)) {
	            c2 = utftext.charCodeAt(i+1);
	            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
	            i += 2;
	        }
	        else {
	            c2 = utftext.charCodeAt(i+1);
	            c3 = utftext.charCodeAt(i+2);
	            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
	            i += 3;
	        }

	    }
	    return string;
	}
}