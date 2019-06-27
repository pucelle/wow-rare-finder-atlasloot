//地图缺少太阳之井:战场和东瘟疫的血色领地
//待替换地图:冰冠堡垒和红玉圣殿,一些未完成的副本
//待翻译地图: 红玉圣殿以及艾泽拉斯副本地图
//id被更改的地图:风暴要塞3842-3845,格鲁尔的巢穴3618-3923,祖尔格拉布19-1977,魔导师平台4095-4131,禁魔监狱3846-3848,祖尔法拉克978-1176,诺莫瑞根133-721
//其他:海加尔, 柯赞, 吉尔尼斯, 未知的其他...
//待完成的传送门以及船和飞艇,地铁:沙塔斯,暴风城...
//maps.xml包含了地图基本信息以及地图之间用以链接触发的元素.就是一些area和图片,按钮(兼有透明度和指向角度设置)等...
//npcs.xml包含用以注册到地图上的NPC,包含了稀有,稀有精英,世界boss,未来还将有副本怪物,并逐渐向兼容atlasloot的atlas靠拢
	//设计的初衷是在每个boss所在的位置通过mouseover触发一个tooltip,用来显示截图和掉落,但是遇到了困难:很多怪物有活动区域的,但是tip会覆盖掉这些区域.
	//旧的地图上还没有标识完整的boss位置
//objects.xml......还未加入
//loots.xml用以注册boss掉落
//items.xml用以描述npc或者object的掉落
//因为成就的构成比较复杂,暂时不提供对其的支持

var wowmap = {
	init : function(xmldoc){
		this.xml = xmldoc;
		this.xmap = {};
		var allmaps = xpath.findall(this.xml, "map");

		for(var i=0; i<allmaps.length; i++){
			this.xmap[allmaps[i].getAttribute("id")] = allmaps[i];
		}
		
		this.tr   = document.getElementById("tr");	//前台的透明层,用来设置#map
		this.elm  = document.getElementById("map");	//地图图片的容器
		
		this.buttonup = document.getElementById("but-up");
		this.buttondown = document.getElementById("but-down");

		this.name = [];
		for(var i=0; i<5; i++)
			this.name[i] = document.getElementById("name"+i);
		
		this.elm.oncontextmenu = this.getback;
		this.hl = document.getElementById("hl");
		//this.audio = document.getElementById("audio");
		this.fhs = {};		//储存背景图片,副本标记和floor按钮
		this.hls  = {};		//储存高亮图片
		this.currentid = "";	//寄存当前激活的地图name
		
		this.rotatearray = {};	//以id为索引的旋转元素
		this.rotatestyle = browser.ff ? "-moz-transform" : browser.opera ? "-o-transform" : "-webkit-transform";
		this.rotateindex = browser.ff ? "MozTransform" : browser.opera ? "OTransform" : "WebkitTransform";
		
		this.waittoclick = {};	//等待点击的元素
		this.setmap(this.xmap[store.get("map")] ? store.get("map") : "-1", !!this.audio);
		
		if(!browser.ie) window.setInterval(this.rotatebutton, 64);
	},
	rotatebutton : function(){
	//被interval调用的函数,其中的this指向window
		if(wowmap.currentid && wowmap.rotatearray[wowmap.currentid]){
			var arr = wowmap.rotatearray[wowmap.currentid];
			for(var i=0, newdeg; i<arr.length; i++){
				arr[i][1] = arr[i][1] + 4.01;	//如果加和重归0(360的整数倍)，那么firefox将将其直接显示为初始状态,从而发生很不平滑的过渡
				arr[i][0].style[wowmap.rotateindex] = "rotate(" + arr[i][1] + "deg)";
			}
		}
	},
	setcount : 0,
	setmap : function(id){
	//必须保证id地图存在.有分层地图地图时自动跳转到1号
		//id = "-1";
		
		this.fadelight();	//同样是为了应付IE

		if(id.indexOf("-") === -1 && this.xmap[id + "-1"])
			id = id + "-1";

		if(id.indexOf("-") > 0){
			this.buttonup.style.display = "block";
			this.buttondown.style.display = "block";
		}else{
			this.buttonup.style.display = "none";
			this.buttondown.style.display = "none";
		}
			
		if(this.fhs[id]){	//要设定的地图或者已被载入
			if(this.currentid){
				this.fhs[this.currentid].style.display = "none";	//隐藏当前地图
				document.getElementById("img" + this.currentid).style.display = "none";
			}
			this.fhs[id].style.display = "block";

			if (document.getElementById("img" + id)) {
				document.getElementById("img" + id).style.display = "block";
			}
			
			this.tr.useMap = "#map-"+id;
			this.currentid = id;
			//window.location.hash = id;
			//if(this.setcount++ === 0)// || id==="World" || id==="Cosmic")
			//	this.audio.play();
				
		}else{	//创建背景图
			this.createmap(id);
			this.createfronthead(id);	//自动加载地图
		}
		store.set("map", id);
		//this.setname("");
	},
	
	createmap : function(id){
		var node = this.xmap[id];
		if(!node) return;
		
		var areas = xpath.findall(node, "area");
		if(areas.length > 0){
			var newmap = document.createElement("map");
			newmap.id   = "map-"+id;
			newmap.name = "map-"+id;
			//newmap.addEventListener("contextmenu", this.getback, false);
			newmap.oncontextmenu = this.getback;
			for(var i=0, html=[]; i<areas.length; i++){
				var area = areas[i];
				var shape = area.getAttribute("shape") || "polygon";
				html.push('<area shape="' + shape + '" coords="'+area.getAttribute("coords")+'"');
				var href = area.getAttribute("href");
				//如果数据完备,这个判断可以省掉
				var hrefmap = this.xmap[href];
				if(hrefmap){
					//html.push(' title="'+hrefmap.getAttribute("namecn")+'"');
					html.push(' onclick="wowmap.setmap(\''+href+'\')"');
				}
				var hlcoords = area.getAttribute("hlcoords");
				var hlsize = area.getAttribute("hlsize");
				if(hlcoords){
					var hltype = area.getAttribute("hltype") || "png";
					html.push(' onmouseover="wowmap.highlight(\''+href + '\',\'' + hltype +'\','+hlcoords+','+hlsize+')'+ 
					';wowmap.setname(\''+hrefmap.getAttribute("namecn") + 
					//"(" + href + ")" +
					'\')'+'"');
					html.push(' onmouseout="wowmap.fadelight(\''+href+'\')'+(hrefmap ? ';wowmap.clearname()' : "")+'"');
					
					//预加载高亮图
					loadimage("highlights/" + href + '.' + hltype);
					
				}else if(hrefmap){
					html.push(' onmouseover="wowmap.setname(\''+hrefmap.getAttribute("namecn") + 
					//"(" + href + ")" +
					'\')"');
					html.push(' onmouseout="wowmap.clearname()"');
				}
				html.push(' />')
			}
			newmap.innerHTML = html.join("");
			document.body.appendChild(newmap);
		}
	},

	up : function(){
		//用以自动添加map上下翻页的代码
		var index = this.currentid.indexOf("-");
		if(index > 0){
			var floor = parseInt(this.currentid.slice(index+1));	//当前楼层
			index = this.currentid.slice(0, index);
			if(floor === 1){	//如果上个地图不存在
				for(var i=2; this.xmap[index+"-"+i]; i++){}
				var prevfloor = index + "-" + (i-1);
			}else
				var prevfloor = index + "-" + (floor-1);
			this.setmap(prevfloor);
		}
	},
	
	down : function(){
		//用以自动添加map上下翻页的代码
		var index = this.currentid.indexOf("-");
		if(index > 0){
			var floor = parseInt(this.currentid.slice(index+1));	//当前楼层
			index = this.currentid.slice(0, index);
			var nextfloor = index + "-" + (floor+1);
			if(!this.xmap[nextfloor])
				nextfloor = index + "-1";
			this.setmap(nextfloor);
		}
	},
	
	getback : function(e){
	//被dom元素调用
		e = e || window.event;
		if(e){
			if(browser.ie)
				e.cancelBubble = true;
			else
				e.stopPropagation();	//中止事件传播.
		}
		//if(wowmap.xmap[wowmap.currentid]){
			var backpage = wowmap.xmap[wowmap.currentid].getAttribute("back");
			if(backpage)
				wowmap.setmap(backpage);
			//else
				//wowmap.setmap("World");
		//}
		wowmap.setname("");
		wowmap.rightButtonClick = true;
		return false;
	},
	
	setname : function(namecn){
		for(var i=0; i<5;i++)
			this.name[i].innerHTML = '<span>'+namecn+'</span>';//this.hls[name]//.getAttribute("namecn");
	},
	
	clearname : function(){
		for(var i=0; i<5;i++)
			this.name[i].innerHTML = '';
	},
	
	highlight : function(id, type, x, y, w, h){
		//if(browser.ie6) return;
		if(this.hls[id]){
			this.hl.appendChild(this.hls[id]);
		}else{
			var img = new Image();
			img.className = "highlight";
			img.onload = function(){
				this.onload = null;
				if(w && h){
					img.style.width = w+"px";
					img.style.height = h+"px";
				}
				img.style.left = x+"px";
				img.style.top  = y+"px";
				wowmap.hl.appendChild(img);
				if(!browser.ie6) wowmap.hls[id] = img;	//由于使用了IE fix,而每次png图片都要重新渲染,所以不对其做保存.这种重新渲染还会产生类似刷新的效果
			}
			img.src = "highlights/"+id+ "." + type;
		}
	},
	
	fadelight : function(){
		//有时候会发生fadelight没有被触发的情况
		while(this.hl.firstChild){
			this.hl.removeChild(this.hl.firstChild);
		}
	},
		
	loadnpc : function(html, nm, mid){
	//将拾取表的NPC信息添加到前面去
	//npc信息有些固定的属性,还有一个掉落表.加载掉落表时会自动调用loot的函数根据掉落的概率从高到低组成页面.
		var tp = wowtip.datatype[nm];
		var npcs = xpath.findall(wowtip.data[nm], tp + "/at[@map='" + mid + "']");
		if(npcs.length > 0){
			for(var i=0; i<npcs.length; i++){
				var at  = npcs[i];
				var npc = at.parentNode;
				var npcid = npc.getAttribute("id");
				var npctype = npc.getAttribute("type");
				var coord = at.getAttribute("xy").split(" ");
				//var src   = npc.getAttribute("src");
				var drop  = !!xpath.find(npc, "drop");
				var coords = at.getAttribute("coords");
				html.push('<div class="npc');
				
				//if(!src)
					html.push(npctype);
					
				if(al.bindnpc[npcid] || drop)
					html.push(' cur-loot');
				
				html.push('" style="left:' + coord[0] + 'px;top:' + coord[1] + 'px;"');
				
				var albind = al.bindnpc[npcid];
				
				if(albind){
					html.push(' onclick="al.open(\''+ al.bindnpc[npcid] +'\')"');
				}else if(drop){
					html.push(' onclick="loot.show(\''+ nm +'\',\''+npcid+'\')"');
				}
				
				html.push(' onmouseover="wowtip.show(this,\''+ nm +'\',\'' + npcid + '\')');
				if(!albind) html.push(';loot.showcoords(this.parentNode,\''+ nm +'\',\''+ npcid +'\',\''+ mid +'\')');
				html.push('"');
				
				html.push(' onmouseout="wowtip.hide()"');

				html.push('>');
									
				//if(src)
				//	html.push('<img src="' + src + '" /></div>');
				//else{
					if(npctype === "rare" || npctype === "elite" || npctype === "rareelite"){
						var level  = parseInt(npc.getAttribute("level"));
						var level1 = Math.floor(level / 10);
						var level2 = level % 10;
						if(level1){
							html.push('<div class="lv1" style="background-image:url(background/' + level1 + '.png)"></div>');
							html.push('<div class="lv2" style="background-image:url(background/' + level2 + '.png)"></div>');
						}else{
							html.push('<div class="lv" style="background-image:url(background/' + level2 + '.png)"></div>');
						}
					}
					html.push('</div>');
				//}
			}
		}
	},
	
	createfronthead : function(id){
		var node = this.xmap[id];
		if(!node) return;
		
		var html = [];

		var buts = xpath.findall(node, "but");	//指向副本区域
		
		if(buts.length > 0){
			for(var i=0; i<buts.length; i++){
				var but = buts[i];
				var coord = but.getAttribute("coord").split(",");
				var href  = but.getAttribute("href");
				var hrefmap = this.xmap[href];
				var degree = but.getAttribute("deg");
				html.push('<div class="but');
				html.push(but.getAttribute("type"));
					
				html.push('" style="left:' + coord[0] + 'px;top:' + coord[1] + 'px;' + 
					(degree ? this.rotatestyle + ':rotate('+degree+'deg);' : "") +
					'"');
				html.push(' onclick="wowmap.setmap(\''+href+'\')"');
				if(hrefmap){
					html.push(' onmouseover="wowmap.setname(\''+hrefmap.getAttribute("namecn") +
					//"(" + href + ")" +
					'\')"');
					html.push(' onmouseout="wowmap.clearname()"');
				}else{
					html.push(' onmouseover="wowmap.setname(\''+href+'\')"');
					html.push(' onmouseout="wowmap.clearname()"');
				}
				
				html.push('></div>');
			}
		}
		
		//加载指定的NPC等数据
		for(var i=0; i<this.usedata.length; i++){
			this["load" + wowtip.datatype[this.usedata[i]]](html, this.usedata[i], id);
		}
				
		var div = this.fhs[id] = document.createElement("div");
		div.className = "fh";
		div.innerHTML = html.join("");
		wowmap.elm.appendChild(div);
		
		var img = new Image();
		img.id = "img" + id;
		img.onload = function(){	//onload可以这么创建,onmouseover等常驻的不要创建这样的闭包
			this.onload = null;
			wowmap.elm.appendChild(this);
			wowmap.setmap(id);
		}
		img.src = "maps/"+id+".jpg";
		var arr = this.rotatearray[id] = [];
		var divchildren = div.getElementsByTagName("div");	//查找传送门
		for(var i=0; i<divchildren.length; i++){
			var but = divchildren[i];
			if(/^but[1-5]$/.test(but.className)){
				arr.push([but, 0]);//parseInt(360 * Math.random())
			}
		}
	}
};

var loot = {
//拾取表.基本信息:npc类型决定了显示的图标样式,如果有掉落表,鼠标样式改换,点击时激活掉落表
	//关于掉落信息:是按区间来划分的,例如10人N,10人H,25N,25H.每个区间一列.每列最多15项(仿atlasloot).如果一页无法显示,生成更多的页
	//active : true,
	
	init : function(){
		this.cur = document.getElementById("curtain")
		this.elm = this.cur.lastChild;
		this.cur.oncontextmenu = function(){
			loot.hide();
			/*
			//无效,不知道为什么
			e = e || window.event;
			if(e){
				if(browser.ie)
					e.cancelBubble = true;
				else
					e.stopPropagation();	//中止事件传播.
			}
			*/
			wowmap.rightButtonClick = true;
		}
		this.lootarray = {};
		this.coodinates = {};
		this.curprev = document.getElementById("cur-prev");
		this.curnext = document.getElementById("cur-next");
		
		//添加鼠标手势
		//if(!ie){
		//	this.elm.addEventListener("mousedown", )
		//}
	},
	

	showcoords : function(pe, nm, id, mid){
	//显示指定id的npc在指定地图上的坐标
		var div, tp = wowtip.datatype[nm];
		if(this.lastcoordinates && this.lastcoordinates.parentNode){
			this.lastcoordinates.parentNode.removeChild(this.lastcoordinates);
			this.lastcoordinates = null;
		}
		if(this.coodinates[id] && (div = this.coodinates[id][mid])){
		}else{
			div = document.createElement("div");
			div.className = "coords";

			var xl = xpath.findvalue(wowtip.data[nm], tp + "[@id='"+ id +"']/at[@map='"+mid+"']/@coords");
			xl = xl.split(" ");
			for(var i=0, arr=[]; i<xl.length;){
				arr.push('<div class="coord" style="left:'+xl[i++]+'px;top:'+xl[i++]+'px"></div>');
			}
			div.innerHTML = arr.join("");
		}
		pe.appendChild(div);
		this.lastcoordinates = div;
	},
	
	create : function(nm, id){
	//创建拾取表格
		var tp = wowtip.datatype[nm];
		if(!this.lootarray[nm])
			this.lootarray[nm] = {};
		var npc = xpath.find(wowtip.data[nm], tp + "[@id='" + id + "']");
		if(npc){
			var npcname = xpath.findvalue(npc, "name/text()");
			var drops   = xpath.findall(npc, "drop");
			if(drops.length > 0){
				this.lootarray[nm][id] = [];	//drop表的缓存,可能一个drop生成多页,也可能多个drop生成一页.彼此之间的存在着按钮,来将列表分割
				for(var i=0, list=[]; i<drops.length; i++){
					var droptxt = xpath.findvalue(drops[i], "text()");
					var droplist = drops[i].getAttribute("data").split(" ");
					var droppages = Math.ceil(droplist.length / 15);	//页数
					
					if(droppages <= 3)	//当处于一页时,尽量将物品的显示对齐
						var everypage = Math.ceil(droplist.length / droppages);	//每页的最大容纳数
					else
						var everypage = 15;
						
					var listplus = 0;
					for(var i=0; i<droppages; i++){
						list.push([droptxt, droplist.slice(everypage * i, everypage * (i + 1))]);
					}
				}
				
				for(var i=0; i<list.length; i+=3){
					var div = this.createonepage(npcname, list[i], list[i+1], list[i+2]);
					this.lootarray[nm][id].push(div);
					if(i === 0)
						this.show(nm, id);
				}

				if(i > 3){
					this.curprev.style.display = "block";
					this.curnext.style.display = "block";
				}else{
					this.curprev.style.display = "none";
					this.curnext.style.display = "none";
				}
			}
		}
	},
	
	createonepage : function(){
	//根据最多三个参数创建一页
		var div = document.createElement("div");
		var len = arguments[3] ? 3 : arguments[2] ? 2 : arguments[1] ? 1 : 0;
		//if(len === 0) return null;
				
		var html = ['<div class="curhead">'+ arguments[0] +'</div><table class="loottable">'];
		
		//次级标题头,用于分割掉落表的,但是目前没有用上
		//html.push('<thead><tr>');
		//for(var i=1; i<=len; i++){
		//	html.push('<th colspan="2">'+ arguments[i][0] +'</th>');
		//}
		//html.push('</tr></thead>');
		
		html.push('<tbody>');
		var max = Math.max(arguments[1][1].length, arguments[2] ? arguments[2][1].length : 0, arguments[3] ? arguments[3][1].length : 0);
		for(var i=0; i<max; i++){
			html.push('<tr>');
			for(var j=1; j<=len; j++){
				if(arguments[j][1][i]){
					var id = arguments[j][1][i];
					var p = id.indexOf(":");
					var rate = p > 0 ? id.slice(p + 1) + "%" : "%";
					id = id.slice(0, p>0 ? p : undefined);
					html.push('<td>');
					wowtip.linkiconandname(html, "item", id);
					html.push('</td><th>');
					html.push(rate);
					html.push('</th>');
				}else{
					html.push('<td></td><th></th>');
				}
			}
			html.push('</tr>');
		}
		
		html.push('</tbody></table>');
		div.innerHTML = html.join("");
		return div;
	},

	show : function(nm, id, page){
	//显示指定id的指定页,自动调用create创建
		page = page || 0;
		wowtip.hide();
		
		while(this.elm.firstChild)
			this.elm.removeChild(this.elm.firstChild);
		al.active = false;
			
		this.currentname = nm;
		this.currentid = id;
		this.currentpage = page;
		
		if(this.lootarray[nm] && this.lootarray[nm][id]){
			if(!this.lootarray[nm][id][page])
				page = 0;
			this.elm.appendChild(this.lootarray[nm][id][page]);
		}else{
			this.create(nm, id);	//此过程中有保存cache和加载第一页的步骤
		}

		this.cur.style.display = "block";
		al.man.style.display = "none";
		al.hrc.style.display = "none";
		this.currentpage = page;
	},
	
	hide : function(){
	//隐藏拾取
		if(al.active && al.current && al.data[al.current] && al.data[al.current].back){
			al.open(al.data[al.current].back);
		}else
			loot.cur.style.display = "none";
	},
	
	prev : function(){
	//前一页
		var array = loot.lootarray[loot.currentname][loot.currentid];
		var page = loot.currentpage;
		if(page <= 0){
			loot.show(loot.currentname, loot.currentid, array.length - 1);
		}else{
			loot.show(loot.currentname, loot.currentid, page - 1);
		}
	},
	
	next : function(){
	//下一页
		var array = loot.lootarray[loot.currentname][loot.currentid];
		var page = loot.currentpage;
		if(page >= array.length - 1){
			loot.show(loot.currentname, loot.currentid, 0);
		}else{
			loot.show(loot.currentname, loot.currentid, page + 1);
		}
	}
};

//地图表清单,这里同样有控制atlasloot的结构的代码,而隔壁的al.js只用来存储数据
wowmap.menu = [
	["卡里姆多",457,[
		["达纳苏斯",1639],
		["埃索达",3557],
		["奥格瑞玛",1637],
		["雷霆崖",1638],
		["泰达希尔",141],
		["秘蓝岛",3524],
		["杜隆塔尔",14],
		["莫高雷",215],
		["贫瘠之地",17],
		["秘血岛",3525],
		["黑海岸",148],
		["石爪山脉",406],
		["灰谷",331],
		["千针石林",400],
		["凄凉之地",405],
		["尘泥沼泽",15],
		["菲拉斯",357],
		["塔纳利斯",440],
		["艾萨拉",16],
		["费伍德森林",361],
		["安戈洛环形山",490],
		["冬泉谷",618],
		["希利苏斯",1377],
		["月光林地",493]
	]],
	["东部王国",-3,[
		["暴风城",1519],
		["铁炉堡",1537],
		["幽暗城",1497],
		["银月城",3487],
		["丹莫罗",1],
		["艾尔文森林",12],
		["永歌森林",3430],
		["提瑞斯法林地",85],
		["幽魂之地",3433],
		["洛克莫丹",38],
		["银松森林",130],
		["西部荒野",40],
		["赤脊山",44],
		["暮色森林",10],
		["希尔斯布莱德丘陵",267],
		["湿地",11],
		["奥特兰克山脉",36],
		["阿拉希高地",45],
		["荆棘谷",33],
		["荒芜之地",3],
		["悲伤沼泽",8],
		["灼热峡谷",51],
		["诅咒之地",4],
		["辛特兰",47],
		["燃烧平原",46],
		["西瘟疫之地",28],
		["东瘟疫之地",139],
		["逆风小径",41],
		["东瘟疫之地：血色领地",4298],
		["奎尔丹纳斯岛",4080]
	]],
	["外域",-2,[
		["沙塔斯城",3703],
		["地狱火半岛",3483],
		["赞加沼泽",3521],
		["泰罗卡森林",3519],
		["纳格兰",3518],
		["刀锋山",3522],
		["虚空风暴",3523],
		["影月谷",3520]
	]],
	["诺森德",-5,[
		["达拉然",4395],
		["北风苔原",3537],
		["嚎风峡湾",495],
		["龙骨荒野",65],
		["灰熊丘陵",394],
		["晶歌森林",2817],
		["祖达克",66],
		["索拉查盆地",3711],
		["风暴峭壁",67],
		["冰冠冰川",210],
		["冬拥湖",4197],
		["洛斯加尔登陆点",4742]
	]],
	["旧世界副本",,[
		["怒焰裂谷",2437],
		["哀嚎洞穴",718],
		["死亡矿井",1581],
		["影牙城堡",209],
		["黑暗深渊",719],
		["监狱",717],
		["诺莫瑞根",721],
		["剃刀沼泽",491],
		["剃刀高地",722],
		["血色修道院",796],
		["奥达曼",1337],
		["祖尔法拉克",1176],
		["玛拉顿",2100],
		["沉没的神庙",1477],
		["黑石深渊",1584],
		["黑石塔",1583],
		["斯坦索姆",2017],
		["通灵学院",2057],
		["厄运之槌",2557],
		["祖尔格拉布",1977],
		["安其拉废墟",3429],
		["熔火之心",2717],
		["黑翼之巢",2677],
		["安其拉",3428]
	]],
	["外域副本",,[
		["地狱火城墙",3562],
		["鲜血熔炉",3713],
		["奴隶围栏",3717],
		["幽暗沼泽",3716],
		["法力陵墓",3792],
		["奥金尼地穴",3790],
		["旧希尔斯布莱德丘陵",2367],
		["塞泰克大厅",3791],
		["黑色沼泽",2366],
		["破碎大厅",3714],
		["蒸汽地窟",3715],
		["暗影迷宫",3789],
		["禁魔监狱",3848],
		["生态船",3847],
		["能源舰",3849],
		["魔导师平台",4131],
		["卡拉赞",2562],
		["祖阿曼",3805],
		["格鲁尔的巢穴",3923],
		["玛瑟里顿的巢穴",3836],
		["毒蛇神殿",3607],
		["风暴要塞",3845],
		["海加尔峰",3606],
		["黑暗神殿",3959],
		["太阳之井高地",4075]
	]],
	["诺森德副本",,[
		["乌特加德城堡",206],
		["魔枢",4120],
		["艾卓-尼鲁布",3477],
		["安卡赫特：古代王国",4494],
		["达克萨隆要塞",4196],
		["紫罗兰监狱",4415],
		["古达克",4375],
		["岩石大厅",4264],
		["乌特加德之巅",1196],
		["净化斯坦索姆",4100],
		["魔环",4228],
		["闪电大厅",4272],
		["冠军的试炼",4723],
		["灵魂洪炉",4809],
		["萨伦矿坑",4813],
		["映像大厅",4820],
		["黑曜石圣殿",4493],
		["纳克萨玛斯",3456],
		["永恒之眼",4500],
		["奥杜尔",4273],
		["阿尔卡冯的宝库",4603],
		["十字军的试炼",4722],
		["奥妮克希亚的巢穴",2159],
		["冰冠城塞",4812],
		["红玉圣殿",4987]
	]],
	["战场",,[
		["战歌峡谷",3277],
		["阿拉希盆地",3358],
		["奥特兰克山谷",2597],
		["风暴之眼",3820],
		["远古海滩",4384],
		["征服之岛",4710]
	]]
];

var openSubmenu = function(e){
	var ul = e.getElementsByTagName("ul")[0];
	if(ul) ul.style.display = "block";
};

var closeSubmenu = function(e){
	var ul = e.getElementsByTagName("ul")[0];
	if(ul) ul.style.display = "none";
};

var menuRegister = function(){
//用于根据一个模拟lua表的数组结构生成一个多级菜单
	var lirecursion = function(ar, ht, fn){
	//第一个参数为用于生成li节点的一个数组,包含[名称, id, 子表]
		if(ar[2]){
			ht.push('<li');
			ht.push(' class="lisubmenu" onmouseover="openSubmenu(this)" onmouseout="closeSubmenu(this)"><span class="subfolder"');
			
			if(ar[1])
				ht.push(' onclick="' + fn(ar[1]) + '"');
			
			ht.push('>' +(browser.ie ? "&nbsp;" : "") + ar[0] + '</span>');
			ht.push('<ul class="submenu">');
			for(var i=0; i<ar[2].length; i++){
				lirecursion(ar[2][i], ht, fn);
			}
			ht.push('</ul></li>');
		}else{
			ht.push('<li><span onclick="' + fn(ar[1]) + '">' +(browser.ie ? "&nbsp;" : "") + ar[0] + '</span></li>');
		}
	};
	
	var emopen  = function(){openSubmenu(this);};
	var emclose = function(){closeSubmenu(this);};
	
	return function(em, ar, fn){
	//为一个当鼠标滑过可以弹出子菜单的多级列表注册事件
	//列表结构:<span>内容</span>(这里不能有空字符)<ul><li>子菜单列表</li></ul>
		
		var ul = document.createElement("ul");
		ul.className = "mainsubmenu";
		var ht = [];
		for(var i=0; i<ar.length; i++){
			lirecursion(ar[i], ht, fn);
		}
		ul.innerHTML = ht.join("");
		em.onmouseover = emopen;
		em.onmouseout  = emclose;
		em.appendChild(ul);
		return ul;
	}
}();
