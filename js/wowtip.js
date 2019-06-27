var NpcClass = {
	"1"	: "野兽",
	"2"	: "龙类",
	"3"	: "恶魔",
	"4"	: "元素生物",
	"5"	: "巨人",
	"6"	: "亡灵",
	"7"	: "人型生物",
	"9"	: "机械",
	"10": "未指定",
	"12": "小伙伴"
};

var NpcType = {
	"rare" : "稀有",
	"elite" : "精英",
	"rareelite" : "稀有精英",
	"boss" : "BOSS"
};

var wowtip = {
//用以根据寄存数据生成tooltip窗口,数据格式必须符合预先设置的规范
//支持类型:item,npc,spell,achievement,quest,object,map+coords
//调用格式show:type,id,(当type为map时,这里可以包含坐标对应类型和id,而当type为screenshot时,这里可以包含一个候选数组)px,py
	maxwidth: 276,
	//限制纯文字状态下的宽度
	
	waitingid : 0,	//异步申请下的保护性id
	limitwidth : {
		"item" : true,
		"spell" : true,
		"achievement" : true,
		"quest" : true
	},
	
	showleftside : {
	//一般用于携带地图的元素,例如NPC弹出在坐标,而右侧的地图弹出在右边,这样不至于影响浏览
		//"npc" : true,
		//"object" : true
	},
	
	datatype : {
	//将指定名称的数据库绑定到指定类型的数据类型上
	//地图信息是始终共享的,统一由map支取
	//item,spell,npc,等等信息是通过指定名称使用相关模板来存取
	//screenshot直接支取
	//coord通过指定名称来存取
		"map" : "map",
		"screenshot": "screenshot"
	},
	dataext : {},	//用于表明数据的格式
	init : function(xmltable){
	//载入文件,做一些初始化的工作,map,coord不在这里初始化
		this.cache = {};
		this.data  = {};
		for(var i in xmltable){
			this.data[i] = xmltable[i];
		}
		this.cache["lose"] = document.createElement("div");
		this.cache["lose"].innerHTML = "没有找到相关数据!";
	},
	
	get : function(nm, id){
	//取得节点
		return xpath.find(this.data[nm], this.datatype[nm]+"[@id='"+id+"']");
	},
	
	//getall : function(nm, id){
	//取得节点
	//	return xpath.findall(this.data[nm], this.datatype[nm]+"[@id='"+id+"']");
	//},
	
	create : {
	//创建tip的函数集合
		"map" : function(id, div){
			div.innerHTML = '<img src="maps/' + id + '.jpg" />';
		},
		"item" : function(xn, div){
			div.innerHTML = 
			xpath.findvalue(xn, "code/text()").replace(/\[/g, "<").replace(/\]/g, ">")
			+"<div class=\"q0\">id: "+xn.getAttribute("id")+"</div>";
		},
		"spell" : function(xn, div){
			div.innerHTML = xpath.findvalue(xn, "code/text()").replace(/\[/g, "<").replace(/\]/g, ">");
		},
		"achievement" : function(xn, div){
			div.innerHTML = xpath.findvalue(xn, "code/text()").replace(/\[/g, "<").replace(/\]/g, ">");
		},
		"npc" : function(xn, div){
			var arr = [];
			var photo = xpath.findvalue(xn, "screenshot/text()");
			if(photo)
				arr.push('<div class="screenshot-no"><img src="'+wowtip.filepath.ss+photo+'.jpg" /></div>');
			arr.push('<div class="name a'+xn.getAttribute("A")+" h"+xn.getAttribute("H")+'">'+xpath.findvalue(xn, "name/text()")+"</div>");
			var rank = xpath.findvalue(xn, "rank/text()");
			if(rank)
				arr.push('<div class="rank"><b>&lt;</b>'+rank+"<b>&gt;</b></div><div>");
			var level = xn.getAttribute("level");
			if(level)
				arr.push('<div><span class="level">等级 '+level+"</span> "+NpcClass[xn.getAttribute("class") || "10"]+"</div>");
			var health = xn.getAttribute("health");
			if(health)
				arr.push('<div><span class="health">生命值: '+health+"</span></div>");
			var event = xpath.findvalue(xn, "event/text()");
			if(event)
				arr.push('<div class="event">事件: '+event+"<div>");
				
			var spawn = xn.getAttribute("spawn");
			if(spawn)
				arr.push('<div class="spawn">刷新: '+spawn+"<div>");

			div.innerHTML = arr.join("");
		},
		"quest" : function(xn, div){
			var arr = [];
			arr.push('<table><tr><td class="name">'
			+xpath.findvalue(xn, "name/text()")+"</td>");
			var colors = xn.getAttribute("colors");
			if(colors && colors!=="0 0 0 0 0"){
				arr.push("<th>");
				colors = colors.split(" ");
				for(var k=0; k<5; k++){
					if(colors[k] !== "0"){
						arr.push('<span class="d'+k+'">'+colors[k]+" </span>");
					}
				}
				arr.push("</th>");
			}	
			arr.push("</tr></table>");
			var desc = xpath.findvalue(xn, "description/text()");
			if(desc)
				arr.push('<div class="desc">'+desc.replace(/\\n/g, "<br />")+"</div>");
			div.innerHTML = arr.join("");
		},
		"object" : function(xn, div){
			var arr = [];
			var photo = xpath.findvalue(xn, "screenshot/text()");
			if(photo)
				arr.push('<div class="screenshot-no"><img src="'+wowtip.filepath.ss+photo+'.jpg" /></div>');
			arr.push('<div class="name">'+xpath.findvalue(xn, "name/text()")+"</div>");
			var event = xpath.findvalue(xn, "event/text()");
			if(event)
				arr.push('<div class="event">事件: '+event+"<div>");
			div.innerHTML = arr.join("");
		},
		"coord" : function(xn, mid, div){
		//创建地图和坐标集,返回一个div元素
			var xl = xpath.findvalue(xn, "at[@map='"+mid+"']/@coords");
			xl = xl.split(" ");
			for(var i=0, arr=[]; i<xl.length;){
				arr.push('<div class="coord" style="left:'+xl[i++]+'px;top:'+xl[i++]+'px"></div>');
			}
			div.innerHTML = arr.join("");
		},
		"screenshot" : function(id, div){
			//创建截图
			var img = document.createElement("img");
			img.src = wowtip.filepath.ss + id + '.jpg';
			div.appendChild(img);
		}
	},
	
	showElement : function(e, div, tp){
	//把已经创建好的元素插入tip
		div = div || this.cache["lose"];
		if(typeof div === "object" && div.constructor === Array){
			tooltip.swap.apply(tooltip, div);
		}else
			tooltip.swap(div);
			
			//alert(div.offsetWidth)
		if(this.limitwidth[tp] && div.offsetWidth >= this.maxwidth){
		//在IE7下,如果元素被限制了最大宽度,那么当元素的宽度会被其改变时,其真实宽度却并没有向父元素传递
			div.style.width = this.maxwidth + "px";
		}
		//alert(div.offsetWidth)
		tooltip.showbeside(e, tp ? (this.showleftside[tp] ? 0 : 2) : undefined);		
	},
	
	show : function(e, nm, id, mid){
	//显示
		var tp = this.datatype[nm];
		if(!browser.ie && this.cache[nm+"-"+id]){
			if(tp === "coord"){	//此时地图必然已经被创建
				tooltip.swap(this.cache["map-"+mid], this.cache[nm+"-"+id+"-"+mid]);
			}else
				tooltip.swap(this.cache[nm+"-"+id]);
			tooltip.showbeside(e, tp ? (this.showleftside[tp] ? 0 : 2) : undefined);
		}else{
			var div = document.createElement("div");
			div.className = tp + "-tip";
			this.waitingid = id;
			if(this.dataext[nm] === "ajax"){
				loadtxt(this.data[nm].replace("#", id), function(t, id){
					if(wowtip.waitingid === id){
						div.innerHTML = t//.replace(/\[/g, "<").replace(/\]/g, ">");
						if(!browser.ie) this.cache[nm+"-"+mid] = div;
						wowtip.showElement(e, div, tp);	
					}
				}, id);
				
			}else if(this.create[tp]){
				if(tp ==="screenshot" || tp === "map"){
					this.create[tp](id, div, mid);
					if(!browser.ie) this.cache[nm+"-"+id] = div;
					wowtip.showElement(e, div, tp);
				}else if(tp === "coord"){
					if(this.cache["map-"+mid]){
						var map = this.cache["map-"+mid];
					}else{
						var map = document.createElement("div");
						map.className = "map-tip";
						this.create["map"](mid, map);
						if(!browser.ie) this.cache["map"+"-"+mid] = map;
					}
					var xn = this.get(nm, type);
					this.create[tp](id, mid, div);
					if(!browser.ie) this.cache[nm+"-"+id+"-"+mid] = div;
					wowtip.showElement(e, [map, div], tp);
				}else{
					var xn = this.get(nm, id);
					this.create[tp](xn, div);
					if(!browser.ie) this.cache[nm+"-"+id] = div;
					wowtip.showElement(e, div, tp);
				}
			}
		}
	},

	hide : function(){
	//隐藏物品
		tooltip.hide();
	},
	

	//用以根据类型和id,生成可以供触发tooltip的文字链接
	//最初的设计:接受参数示例:
	//item@id=123@icon@name@screenshot@source
	//npc@id=123@name@map
	linkicon : function(html, tp, id, xn, count){
		//提供用于数据链接的图标,count为右下角的数字,当为+-1时不显示,xn为节点,当xn不为空时,不用再次查询
		//iconID用于为div.icon注册id,以响应一些触发事件
		xn = xn || this.get(tp, type);
		html.push('<div class="icon" style="background-image:url(\''+wowtip.filepath.ic);
		html.push(xn.getAttribute("icon")+'.jpg\')">');
		html.push('<div class="icon-border"');
		html.push(' onmouseover="wowtip.show(this,\''+tp+"',"+id+')"');
		html.push(' onmouseout="wowtip.hide()">');		
		html.push('<span></span></div>');
		if(count && count!=="1" && count!=="-1"){
			html.push('<div class="stroke">');
			html.push('<span class="shadow1" style="top:1px">'+count+'</span>');
			html.push('<span class="shadow2" style="top:-1px">'+count+'</span>');
			html.push('<span class="shadow3" style="left:1px">'+count+'</span>');
			html.push('<span class="shadow4" style="left:-1px">'+count+'</span>');
			html.push('<span class="shadow0">'+count+'</span>');
			html.push('<span class="stance">'+count+'</span>');	//用来占位,以帮助stroke确定位置的
			html.push('</div>');
		}
		html.push('</div>');
		return html;
	},
	
	linkname : function(html, nm, id, xn, ac){
	//提供用于一个名称,用以链接各类数据
	//ac为给名称添加的额外样式,地图与道具名称也可以指定样式,但如果不指定二者,则设为默认值
		xn = xn || this.get(nm, type);
		var tp = this.datatype[nm];
		html.push("<span onmouseover=\"wowtip.show(this,'"+nm+"',"+id+')"');
		html.push(' onmouseout="wowtip.hide()"');
		html.push(' class="'+tp+"-name"+(ac ? " "+ac : (tp==="map" ? " cur-direction" : tp==="object" ? " cur-interact" : "")));
		if(xn && tp === "item"){
		//对于物品,改变颜色
			html.push(" q"+(xn.getAttribute("quality") || "1")+'">');
		}else if(xn && tp === "npc"){
		//对于npc,改变颜色
			html.push(" a"+(xn.getAttribute("A")||"0")+" h"+(xn.getAttribute("H")||"0")+'">');
		}else if(xn && tp === "quest"){
		//对于任务,改变颜色
			html.push(" side"+xn.getAttribute("side")+'">');
		}else{
			html.push('">');
		}
		html.push(xpath.findvalue(xn, "name/text()"));
		//html.push("("+id+")");
		html.push('</span>');
		if(xn && tp === "npc"){
		//输出npc的精英级别
			var type = xn.getAttribute("type");
			if(type && (type = NpcType[type]))
				html.push(' <span class="q0"><b>&lt;</b>' + type + "<b>&gt;</b></span>");
		}
		return html;
	},
	
	linkiconandname : function(html, nm, id, count){
		//生成icon name
		var xn = this.get(nm, id);
		var tp = this.datatype[nm];
		html.push('<div class="icon" style="background-image:url(\''+wowtip.filepath.ic);
		html.push(xn.getAttribute("icon")+'.jpg\')">');
		html.push('<div class="icon-border"');
		html.push(' onmouseover="wowtip.show(this,\''+nm+"',"+id+')"');
		html.push(' onmouseout="wowtip.hide()">');		
		html.push('<span></span></div>');
		if(count && count!=="1" && count!=="-1"){
			html.push('<div class="stroke">');
			html.push('<span class="shadow1">'+count+'</span>');
			html.push('<span class="shadow2">'+count+'</span>');
			html.push('<span class="shadow3">'+count+'</span>');
			html.push('<span class="shadow4">'+count+'</span>');
			html.push('<span class="shadow0">'+count+'</span>');
			html.push('<span class="stance">'+count+'</span>');	//用来占位,以帮助stroke确定位置的
			html.push('</div>');
		}
		
		html.push('<div class="icon-name');
		var photo = xpath.findvalue(xn, "screenshot/text()");
		if(photo){
			html.push(' b" onmouseover="wowtip.show(this,\'screenshot\','+photo+')" onmouseout="wowtip.hide()">');
		}else{
			html.push('">');
		}
		html.push('<span class="'+tp+'-name');
		if(xn && tp === "item"){
		//对于物品,改变颜色
			html.push(' q'+(xn.getAttribute("quality") || "1")+'');
		}
		html.push('">');
		html.push(xpath.findvalue(xn, "name/text()"));
		//html.push("("+id+")");
		html.push('</span>');
		html.push('</div>');
		html.push('</div>');
		return html;
	},
	
	linkscreenshot : function(html, nm, id, xn){
	//根据截图的id显示截图
		xn = xn || this.get(nm, id);
		var photo = xpath.findvalue(xn, "screenshot/text()");
		html.push('<span class="screenshot-name" onmouseover="wowtip.show(this,\'screenshot\','+photo+')" onmouseout="wowtip.hide()">截图</span>');
		return html;
	},
	
	linknameandscreenshot : function(html, nm, id, xn){
	//显示物品以及截图
		xn = xn || this.get(nm, id);
		var photo = xpath.findvalue(xn, "screenshot/text()");
		if(photo){
			html.push("&nbsp;--&nbsp;");
			html.push('<span class="screenshot-name" onmouseover="wowtip.show(this,\'screenshot\','+photo+'])" onmouseout="wowtip.hide()">截图</span>');
		}
		return html;
	},
	
	linkal : function(html, id, icon, quality, name, desc, screenshot){
	//使用信息:id,icon,quality,name,screenshot?创建物品图标和名称链接
		html.push('<div class="icon" style="background-image:url(\''+wowtip.filepath.ic);
		html.push(icon + '.jpg\')">');
		if(id === "")
			html.push('<div class="icon-metal"');
		else if(id === 0)
			html.push('<div class="icon-medal"');
		else
			html.push('<div class="icon-border"');
			
		if(id && id !== "0"){
			html.push(' onmouseover="wowtip.show(this,\'al\','+id+')"');
			html.push(' onmouseout="wowtip.hide()"');		
		}
		html.push('>');
		html.push('<span></span></div>');
		html.push('</div>');
		
		html.push('<div class="al-item');
		if(quality)
			html.push(' '+ quality);

		if(screenshot){
			html.push(' b" onmouseover="wowtip.show(this,\'screenshot\','+screenshot+')" onmouseout="wowtip.hide()">');
		//}else if(wowheadscreenshot){
		//	html.push(' b" onmouseover="wowtip.show(this,\'screenshot\','+wowheadscreenshot+',true)" onmouseout="wowtip.hide()">');
		}else{
			html.push('">');
		}

		html.push(name);
		//html.push("("+id+")");
		html.push('</div>');
		
		if(desc)
			html.push('<div class="al-desc">'+ desc +'</div>');
			
		
		return html;
	}
};
