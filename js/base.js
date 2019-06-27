//因为各个浏览器都随着升级而不断变化.所以尽量使用其他方式做浏览器的差异判断
var browser = {
 	ie6:/\bMSIE ?6\.0/.test(navigator.userAgent),
	ie9:/\bMSIE ?9\.0/.test(navigator.userAgent),
	ie: /\bMSIE\b/.test(navigator.userAgent),
	ch: /\bChrome\b/.test(navigator.userAgent),
	ff:	/\bFirefox\b/.test(navigator.userAgent),
    op:	/\bOpera\b/.test(navigator.userAgent),
    sf:	/\bSafari\b/.test(navigator.userAgent),
	vs: parseFloat(navigator.appVersion),
	il:	/^file:/.test(window.location.href)	//页面是否位于本地
};


String.prototype.originalsplit = String.prototype.split;
String.prototype.split = function(s){
	if(this.length === 0)
		return [];
	else
		return this.originalsplit(s);
};

String.prototype.select = function(exp, tar){
	if(typeof tar === "undefined"){
		var sub = [];
		this.replace(exp, function(){
			var arr = [];
			for(var i=1; i<=arguments.length-3; i++)
				arr.push(arguments[i]);
			sub.push(arr);
		});
		if(!exp.global)
			sub = sub[0] || [];
		return sub;
	}else{
		var arr = [];
		if(typeof tar === "string"){
			this.replace(exp, function(){
				var $ = arguments;
				arr.push(
					tar.replace(/\$(\d|&|$)/g, function(){
						if(arguments[1] === "$"){
							return "$";
						}else if(arguments[1] === "&"){
							return $[0];
						}else if(parseInt(arguments[1]) <= $.length-3){
							return $[arguments[1]];
						}else{
							return arguments[0];
						}
					})
				);
			});
		}else if(typeof tar === "function"){
			this.replace(exp, function(){
				arr.push(tar.apply(null, arguments) || "");
			});
		}
		if(!exp.global){
			return arr[0] || "";
		}else{
			return arr;
		}
	}
};

var hasclass = function(em, c){
	if(em) return new RegExp("(?:^| )"+c+"(?= |$)").test(em.className);
};
var addclass = function(em, c){
	if(!hasclass(em, c)) em.className = em.className ? em.className+" "+c : c;
};
var removeclass = function(em, c){
	if(em){
		var newclass = em.className.replace(new RegExp("(?:^| )"+c+"(?= |$)"), "");
		if(newclass !== em.className) em.className = newclass;
	}
};


var each = function(obj, fn){
//数组和表统一的递归调用
	if(typeof obj!=="object" || typeof fn!=="function") return;
	if(obj.constructor === Array){
		for(var i=0; i<obj.length; i++){
			fn(i, obj[i]);
		}
	}else{
		for(var i in obj){
			fn(i, obj[i]);
		}
	}
};

var counting = function(nm, fn){
//在被调用nm次之后调用fn
	var count = 0;
	return function(){
		count++;
		if(count===nm && typeof fn==="function") fn();
	}
};

var domloaded = function(){
//入口函数,用于替代window.onload,当文档模型载入时回调fn,可以放入多个事件
	var eventList = [];
	var startEvent = function(){
	//触发事件,被触发的函数的作用域归属于定义其的地方
		for(var i=0; i<eventList.length; i++)
			if(typeof eventList[i] === "function")
			eventList[i]();
	};
	
	/*以下部分用于注册事件*/
	if (document.addEventListener)
	/*非IE*/
		document.addEventListener("DOMContentLoaded", startEvent, null);
	else if(browser.ie){
	//IE
		document.onreadystatechange = function(){
			if(document.readyState==="loaded" || document.readyState==="complete"){
				this.onreadystatechange = null;
				startEvent();
			}
		}
	}else{
	//主流的5类浏览器不会进行到这里
		window.onload = startEvent;
	}
	
	/*返回添加event的函数供外部访问*/
	return function(fn){
		eventList.push(fn);
	}
}();

var argsArray = function(args, p){
//拷贝参数
	for(var i=(p || 0), arr = []; i<args.length; i++){
		arr.push(args[i]);
	}
	return arr;
};


store = {
	set: function(name, value){
		localStorage.setItem(name, JSON.stringify(value))
	},
	get: function(name){
		try{
			return JSON.parse(localStorage.getItem(name))
		}
		catch (_err) {
			return null
		}
	},
	delete: function(name){
		localStorage.removeItem(name)
	}
}


var loadxml = function(src, fn){
//载入xml文件,返回文档根节点
	var args = argsArray(arguments, 2);
	try{
		if(window.ActiveXObject){	//IE
			var xmlhttp = new ActiveXObject("Msxml2.DOMDocument");
			xmlhttp.setProperty("SelectionLanguage", "XPath");
			xmlhttp.async = true;
			var callback = function(){
				if(xmlhttp.readyState !== 4)
					return;
				window.clearInterval(clock);
				if(typeof fn === "function"){
					args.unshift(xmlhttp.documentElement);
					fn.apply(null, args);
				}
			};
			var clock = window.setInterval(callback, 16);
			xmlhttp.load(src);
		}else{
			var xmlhttp = new window.XMLHttpRequest();
			xmlhttp.onreadystatechange = function(){
				if(xmlhttp.readyState === 4){
					if(typeof fn === "function"){
						args.unshift(xmlhttp.responseXML.documentElement);
						fn.apply(null, args);
					}
				}
			};
			xmlhttp.open("GET", src, true);
			xmlhttp.send(null);
		}
	}catch(e){
		if(typeof fn === "function"){
			args.unshift("");
			fn.apply(null, args);
		}
	}
};

var loadtxt = function(src, fn){
//文本载入,第三个之后的参数将从第二个位置开始传递给fn
	var args = argsArray(arguments, 2);
	try{
		if(window.ActiveXObject){	//IE
			var xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
		}else{
			var xmlhttp = new window.XMLHttpRequest();
		}
		xmlhttp.onreadystatechange = function(){
			if(xmlhttp.readyState === 4){
				if(typeof fn === "function"){
					args.unshift(xmlhttp.responseText);
					fn.apply(null, args);
				}
			}
		};
		xmlhttp.open("GET", src, true);
		xmlhttp.send(null);
	}catch(e){
		if(typeof fn === "function"){
			args.unshift("");
			fn.apply(null, args);
		}
	}
};

var loadimage = function(imgsrc){
//用于预加载图片,暂时不提供回调
	if(typeof imgsrc === "string")
		imgsrc = [imgsrc];
	if(typeof imgsrc === "object" && imgsrc.constructor === Array){
		for(var i=0; i<imgsrc.length; i++){
			new Image().src = imgsrc[i];
		}
	}
};

var xpath = {
//查询xml节点
	find : function(contextNode, xpathString){
	//查找头一个元素
		if(!contextNode || !xpathString)
			return null;
		if(window.ActiveXObject){
			return contextNode.selectSingleNode(xpathString);
		}else{
			var xpe = new XPathEvaluator().evaluate(xpathString, contextNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			if(xpe)
				return xpe.iterateNext();
			else
				return null;
		}
	},
	findall : function(contextNode, xpathString){
	//查找所有元素,返回一个节点集或者数组
		if(!contextNode || !xpathString)
			return [];
		if(window.ActiveXObject)
			return contextNode.selectNodes(xpathString);
		else{
			var nodes = [];
			var xpe = new XPathEvaluator().evaluate(xpathString, contextNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			if(!xpe)
				return nodes;
			var node;
			while(node = xpe.iterateNext()){
				nodes.push(node);
			}
		}
		return nodes;
	},
	findvalue : function(contextNode, xpathString){
	//返回节点的nodeValue
		if(!contextNode || !xpathString)
			return "";
		var node = this.find(contextNode, xpathString);
		if(node && node.nodeValue)
			return node.nodeValue;
		else
			return "";
	},
	findvalues : function(contextNode, xpathString){
	//返回所有节点的nodeValue组成的数组
		if(!contextNode || !xpathString)
			return [];
		var nodes = this.findall(contextNode, xpathString);
		var stringArray = [];
		for(var i=0; i<nodes.length; i++){
			if(nodes[i] && nodes[i].nodeValue)
				stringArray.push(nodes[i].nodeValue);
		}
		return stringArray;
	}
};

var instance = function(tab){
//用以拷贝表,并自动按照init子函数初始化
	for(var $=[], i=1; i<arguments.length; i++)
		$.push(arguments[i]);
		
	var shell = function(){
		if(typeof tab.init === "function")
			tab.init.apply(this, $);
	}
	shell.prototype = tab;
	
	return new shell();
};

var clearchildren = function(em){
//清除子节点
	while(em.firstChild){
		em.removeChild(em.firstChild);
	}
};

var nextsibling = function(em){
//下一个元素节点
	while(em = em.nextSibling){
		if(em.nodeType === 1)
			return em;
	}
	return null;
};


//tooltip弹出条
var win = {
	//窗口的长宽,以及当前所处的滚动位置
	//窗口属性的改变将自动重置win属性
	size : {},
	//窗口宽高
	roll : {},
	//滚动条位置
	resize : function(){
	//获取size,主流浏览器都支持
		this.size.w = document.documentElement.clientWidth;
		this.size.h = document.documentElement.clientHeight;
	},
	reroll : function(){
	//获取scroll
	//在有文档声明下IE6+,opera,ff可以通过documentElement获取.但是chrome和safari只认识document.body.scrollLeft/Top
		this.roll.x = document.documentElement.scrollLeft || document.body.scrollLeft;
		this.roll.y = document.documentElement.scrollTop  || document.body.scrollTop;
	},
	init : function(){
	//初始化,并注册事件,调节窗口或者滚动条位置将重新获取各属性.
	//IE下有一个问题,当双击调整窗口大小时,无法累加因为滚动条的出现或者消失带来的尺度缩放
	//在每次重新显示tooltip时重获属性可以解决这个问题
		window.onresize = function(){
		//调整窗口可能导致滚动条位置变化
			win.resize();
			win.reroll();
		};
		window.onscroll = function(){
			win.reroll();
		};
		this.reset();
	},
	reset : function(){
	//重新获取属性
		this.resize();
		this.reroll();
	},
	offset : function(em){
	//返回元素相对于整个页面的绝对位置
		var x =0, y = 0;
		while(em && em !== document.body && em !== document.body.parentNode){
		//如果元素e的offsetParent不是body,添加其到body的增量.这样得到相对于body的坐标
			x += em.offsetLeft;
			y += em.offsetTop;
			em = em.offsetParent;
		}
		return {x:x, y:y};
	}
};

/*
.tip{
	position:absolute;
	left:-1000px;
	z-index:200;
	border:1px #777 solid;
	color:#ddd;
	background:#000;
	padding:5px;
	opacity:0.9;
	*filter:alpha(opacity=90);
	-moz-border-radius:5px;
	-webkit-border-radius:5px;
	border-radius:5px;
	-webkit-box-shadow:0px 0px 10px #fff;
	-moz-box-shadow:0px 0px 10px #fff;
	box-shadow:1px 1px 10px #000;
}
.tip img{display:block;}
.tip th{padding-left:10px;}
*/
var tooltip = {
//鼠标移动到元素之上时的提示窗口
	dpx	: 2,	//default position x,按照tip相对em的左侧的位置:左->右,标记为0->1,2
	dpy	: 0.68,	//default position y,按照tip相对em的上沿的位置:上->下,标记为0->1,2
	dsp : 5, 	//sp代表着触发tip的元素的间隔空间.用于增加或者减少与tip的缓冲空间.慎用负值的sp,同样会造成鼠标移入tip
	init : function(){
	//创建tooltip,为一个包含3*3区域的table
		var div = document.createElement("div");
		div.className = "tip";
		this.tip = div;
		this.backup = null;	//寄存上个触发tooltip.show的头4个参数
		document.body.appendChild(this.tip);
	},
	swap : function(){
	//将this.con的子节点删除,插入参数节点
		while(this.tip.firstChild)
			this.tip.removeChild(this.tip.firstChild);
		for(var i=0; i<arguments.length; i++)
			this.tip.appendChild(arguments[i]);
	},
	//html : function(c){
	//设定content的innerHTML.设置innerHTML在IE下会可能导致鼠标样式短暂变为指针.
	//	this.tip.innerHTML = c;
	//},
	showbyposition : function(x, y, ew, eh, w, h, px, py){
	//显示tip,6个参数依次为起点坐标,元素宽高,tip宽高
	//tooltip的过渡原则(px,py的生成规则)
	//所要求的应至少一个为0/2,否则tip将覆盖触发元素
	//所满足的应至少一个为0/2,否则将tip紧靠页面左上
	//如果其中一方要求的0/2满足,则另一方非常容易计算:不变或者过渡到02
	//如果一方要求的0/2不满足(另一方要求0->1),将另一方过渡到0/2
		if(typeof px==="undefined") px = this.dpx;
		if(typeof py==="undefined") py = this.dpy;
		var cx = [win.roll.x+w <= x, win.roll.x+win.size.w >= x+w, win.roll.x+win.size.w >= x+w+ew]; //x方向上的可容纳性
		var cy = [win.roll.y+h <= y, win.roll.y+win.size.h >= y+h, win.roll.y+win.size.h >= y+h+eh]; //y方向上的可容纳性
		if(px===0 || px===2){	//要求位于两边
			if(!cx[px]){		//一边不满足,尝试向另一边过渡
				if(cx[2-px])
					px = 2-px;
				else if(py <= 1){
					py = Math.round(py)*2;	//将py按位置过渡到0/2
					if(!cy[py])
						py = 2-py;
				}
			}
		}else if(py===0 || py===2){
			if(!cy[py]){
				if(cy[2-py])
					py = 2-py;
				else{
					px = Math.round(px)*2;
					if(!cx[px])
						px = 2-px;
				}
			}
		}
		if(px === 2)
			x += ew;
		else
			x -= (1-px)*w;
		if(x < win.roll.x)
			x = win.roll.x;
		else if(x+w > win.roll.x+win.size.w)
			x = win.roll.x+win.size.w-w;
		if(py === 2)
			y += eh;
		else
			y -= (1-py)*h;
		if(y < win.roll.y)
			y = win.roll.y;
		else if(y+h > win.roll.y+win.size.h)
			y = win.roll.y+win.size.h-h;
			
		this.tip.style.top  = y+"px";
		this.tip.style.left = x+"px";
	},
	showbymouse : function(e, cs, px, py){
	//tip位置随鼠标移动,认为其对应一高宽为0的元素,额外间距取决于指针样式
	//cs代表着鼠标的尺寸
	//cm用于防止鼠标移入tip的保护像素,只保护左上角
		win.reset();
		e = e || event;
		cs  = cs || 20;
		var cm = this.dsp;
		//firefox等将event作为其触发函数的第一个参数传递过来.IE中则可以直接使用event参数
		//该方法可能存在这种情况:当移动鼠标时,由于tip和鼠标的间距比较短(例如小于2px),导致鼠标移入tip,触发元素的onmouseout
		//this.backup = [win.roll.x+e.clientX-cm, win.roll.y+e.clientY-cm, cs+cm, cs+cm, px, py];
		this.showbyposition(win.roll.x+e.clientX-cm, win.roll.y+e.clientY-cm, cs+cm, cs+cm, this.tip.offsetWidth, this.tip.offsetHeight, px, py);
		
		this.tip.style.opacity = '0.9';
	},
	showbeside : function(em, px, py){
	//显示在触发其的元素旁边
		win.reset();
		var es = this.dsp;
		var x = y = -es;
		var ew = em.offsetWidth + 2 * es;
		var eh = em.offsetHeight + 2 * es;
		/*if(browser.ie){	//IE的一个奇怪的bug,使得td内部元素的offsetTop以td底部为准
			for(var i=0, ep=em.parentNode; ep && i<4; i++){	//向上追溯5层寻找td,一般都足够
				if(ep.nodeName.toLowerCase() === "td"){
					if(ep.childNodes.length === 1)
						y -= (ep.offsetHeight-em.offsetHeight) / 2;
				}
				ep = ep.parentNode;
			}
		}*/
		var offset = win.offset(em);
		x += offset.x; y += offset.y;
		this.backup = [x, y, ew, eh, px, py];
		this.showbyposition(x, y, ew, eh, this.tip.offsetWidth, this.tip.offsetHeight, px, py);
		
		var img = this.tip.getElementsByTagName("img")[0];
		if(img && !img.complete){
			this.bindreshow(img);
		}
		else{
			this.tip.style.opacity = '0.9';
		}

		if(this.hideTimer){
			clearTimeout(this.hideTimer);
			delete this.hideTimer;
		}
	},
	bindreshow : function(img){
	//将图片的onload和重设位置绑定
		this.tip.style.opacity = '0';
		img.onload = this.reshow;
		this.lastshown = img;
	},
	reshow : function(){
	//用于在图片加载完成后,重设tip的位置,被img在onload时调用
		tooltip.tip.style.opacity = '0.9';
		this.onload = null;
		if(tooltip.backup){
			tooltip.backup.splice(4, 0, tooltip.tip.offsetWidth, tooltip.tip.offsetHeight);
			tooltip.showbyposition.apply(tooltip, tooltip.backup);
		}
	},
	hide : function(){
	//1000px应该足够了(取body位置做参考)
		this.tip.style.opacity = '0';
		this.hideTimer = setTimeout(function(){
			tooltip.tip.style.left = '-9999px';
			delete this.hideTimer;
		}, 400);
		if(this.lastshown)
			this.lastshown.onload = null;
	}
};
