
var al = {
//用以创建掉落表
	init : function(){	//atlasloot下拉菜单由其他部分注册
		this.cur = document.getElementById("curtain")
		this.elm = this.cur.lastChild;
		this.sub = document.getElementById("al-submenu"); //em.getElementsByTagName("span")[0];	//显示二级列表的元素
		this.hrc = document.getElementById("heroic");
		this.man = document.getElementById("mancount");

		this.isheroic = store.get("isheroic") === "1";
		this.is25man  = store.get("is25man")  === "1";
		
		this.isalliance = store.get("camp") === "alliance";
		al.loadfavourite();
		//this.shown = store.get("alshown") === "0" ? false : true;

		this.cur.addEventListener('mozHidden' in document ? 'DOMMouseScroll' : 'mousewheel', this.onMouseWheel.bind(this), false);
	},
	//dropdown : [],
	//submenus : {},	//子列表
	data :{},
	//tablenames : {},
	screenshots : {},
	cache : {},
	submenucache : {},
	submenuindex : {},	//submenu当前所处的位置
	submenureverse : function(){
	//寻找子列表父元素.这样在查看子列表时,可以直接调出二级列表
		this.submenuparent = {};
		for(var i in this.submenus){
			var sm = this.submenus[i];
			for(var j=0; j<sm.length; j++){
				if(j === 0)
					this.submenuindex[i] = sm[0][1];
				this.submenuparent[sm[j][1]] = i;//[i, j];
			}
		}
	},
	createpage : function(id){
	//根据data创建页面
		var div = document.createElement("div");
		div.style.position = "relative";
		if(!this.data[id])
			return div;
		var data = this.data[id];
		var html = ['<div class="curhead">'+ this.tablenames[id] +'</div>'];
		for(var i=0; i<data.length; i++){
			var list = data[i];
			if(!list) continue;
			var left = list[0] > 15 ? 500 : 210;
			var top  = ((list[0]-1) % 15) * 42 + 36;
			
			html.push('<div style="left:'+ left +'px;top:'+ top +'px;position:absolute;"');
			if(typeof list[1] === "string"){
				html.push(' onclick="al.open(\'' + list[1] + '\',true)">');
				wowtip.linkal(html, "", list[2], list[3], list[4], list[5].replace(/#(\w+)#/g, '<span class="si-$1">'+ (browser.ie ? '&nbsp;' : '') +'</span>') +" "+(list[6] ? '<span class="q">('+list[6]+")</span>" : ""));
			}else{
				html.push('onclick="al.addtofavourite(event, \''+ id +'\','+ i +')">');
				wowtip.linkal(html, list[1], list[2], list[3], list[4], list[5].replace(/#(\w+)#/g, '<span class="si-$1">'+ (browser.ie ? '&nbsp;' : '') +'</span>') +" "+(list[6] ? '<span class="q">('+list[6]+")</span>" : ""), this.screenshots[list[1]]);
			}
			html.push('</div>');
		}
		div.innerHTML = html.join("");
		this.cache[id] = div;
		return div;
	},
	
	createsubmenu : function(smid){
	//创建,并包含了加载过程
		this.submenucache[smid] = menuRegister(this.sub, this.submenus[smid], function(s){
			return "al.open('" + s + "')\" id=\"" + s + "\"";
		});
	},
	
	getsubmenuandrealid : function(id){
	//取得对应的编组编号
		id = id.replace(/25Man|HEROIC|_A|_H/g, "");
		var arr = ["", "HEROIC", "25Man", "25ManHEROIC"];
		var cmp = ["", "_A", "_H"];
		
		for(var i=0; i<arr.length; i++){
			for(var j=0; j<cmp.length; j++){
				var smid = this.submenuparent[id + arr[i]+cmp[j]];
				if(smid)
					return [smid, id + arr[i]+cmp[j]];
			}
		}
		
		return ["", id];
	},
	open : function(id, resetsubmenu){
	//打开一个掉落表,这个id是经过修正后的真实id
		wowtip.hide();
		
		id = this.idfix(id);

		this.active = true;
		while(this.elm.firstChild)
			this.elm.removeChild(this.elm.firstChild);
		
		var div = this.cache[id] || this.createpage(id);
		this.elm.appendChild(div);
		this.cur.style.display = "block";
				
		var smpid = this.getsubmenuandrealid(id);
		var realid = smpid[1];
		smpid = smpid[0];
		if(smpid)
			this.submenuindex[smpid] = id;

		if(this.data[id]){
			if(this.data[id].prev){
				loot.curprev.style.display = "block";
			}else
				loot.curprev.style.display = "none";
				
			if(this.data[id].next){
				loot.curnext.style.display = "block";
			}else
				loot.curnext.style.display = "none";
		}
		
		al.man.style.display = "block";
		al.hrc.style.display = "block";
				
		if(!this.currentsubmenu || this.currentsubmenu !== smpid){
			if(resetsubmenu)
				while(this.sub.lastChild && this.sub.lastChild.nodeName.toLowerCase() === "ul")
					this.sub.removeChild(this.sub.lastChild);
				
			if(smpid){
				removeclass(this.sub, "menupassive");
				if(this.submenucache[smpid]){
					this.sub.appendChild(this.submenucache[smpid]);
				}else{
					this.createsubmenu(smpid);
				}
				
			}else if(resetsubmenu){
				addclass(this.sub, "menupassive");
			}
		}
		
		var em = document.getElementById(realid);
		if(em)
			this.selectsubmenu(em);
			
		this.current = id;
		store.set("allastbrowser", id);
		this.currentsubmenu = smpid;
		
		/*
		if(/HROIC/.test(id)){
			this.hrc.innerHTML = "切换到普通模式";
			if(this.data[id.slice(0, -6)]){
				removeclass(this.hrc, "menupassive");
			}else{
				addclass(this.hrc, "menupassive")
			}
		}else if(id.slice(-6) === "25Man")
		*/
	},

	onMouseWheel : function(e){
		if(this.cur.style.display === 'block'){
			var isMouseWheelDown = e.detail > 0 || e.wheelDelta < 0;
			var selectedSpan = this.sub.querySelector('.submenuselect');
			var selectedLi;
			var nextLi;

			if(selectedSpan){
				selectedLi = selectedSpan.parentNode;

				if(isMouseWheelDown){
					nextLi = selectedLi.nextSibling ? selectedLi.nextSibling : selectedLi.parentNode.firstChild;
				}
				else{
					nextLi = selectedLi.previousSibling ? selectedLi.previousSibling : selectedLi.parentNode.lastChild;
				}

				al.open(nextLi.firstChild.id);
			}
		}
	},

	openlastbrowser : function(){
		var lastpage = this.current || store.get("allastbrowser");
		if(lastpage)
			this.open(lastpage, true);
	},
	opensubmenu : function(sm){
	//从submenu打开页面
		while(this.sub.lastChild && this.sub.lastChild.nodeName.toLowerCase() === "ul")
			this.sub.removeChild(this.sub.lastChild);
	
		removeclass(this.sub, "menupassive");
		
		if(this.submenucache[sm]){
			this.sub.appendChild(this.submenucache[sm]);
		}else{
			this.createsubmenu(sm);
		}

		if(this.submenuindex[sm])
			this.open(this.submenuindex[sm]);
	},
	selectsubmenu : function(em){
	//选择二级菜单
		if(this.lastselect)
			removeclass(this.lastselect, "submenuselect");
		addclass(em, "submenuselect");
		this.lastselect = em;
	},
	prev : function(){
		if(this.current && this.data[this.current] && this.data[this.current].prev){
			this.open(this.data[this.current].prev);
		}
	},
	next : function(){
		if(this.current && this.data[this.current] && this.data[this.current].next){
			this.open(this.data[this.current].next);
		}
	},
	changecamp : function(camp){
	//修改阵营,自动更新列表
		this.isalliance = camp === "alliance";
		if(this.isalliance){
			document.body.className='alliance';
			store.set('camp','alliance');
		}else{
			document.body.className='horde';
			store.set('camp','horde');
		}
		if(this.cur.style.display === "block" && this.active && this.current){
			if(this.isalliance && /_H/.test(this.current)){
				var allianceid = this.current.replace(/_H/, "_A");
				if(this.data[allianceid]) this.open(allianceid);
			}else if(!this.isalliance && /_A/.test(this.current)){
				var hordeid = this.current.replace(/_A/, "_H");
				if(this.data[hordeid]) this.open(hordeid);
			}
		}
	},
	idfix : function(id){
	//完成切换和id选择工作,在open时调用,并且返回真正需要打开的id
	//id将根据人数,难度,阵营尝试自动更正id,如果这个id不存在,则尝试去除部分属性,降格以求...
		id = id.replace(/25Man|HEROIC|_A|_H/g, "");	
		var buttontype = [0, 0];	//状态0为不激活,1为激活,2为临时切换到对立一侧,并且改变文本:例如,仅英雄模式可用
		
		var normalid = "";
		var heroicid = "";
		var normal25id = "";
		var heroic25id = "";
		
		if(this.data[id] || this.data[id+"_A"] || this.data[id+"_H"]){
			if(this.isalliance && this.data[id+"_A"]){
				normalid = id+"_A";
			}else if(!this.isalliance && this.data[id+"_H"]){
				normalid = id+"_H";
			}else
				normalid = id;
		}
		
		if(this.data[id+"HEROIC"] || this.data[id+"HEROIC_A"] || this.data[id+"HEROIC_H"]){
			if(this.isalliance && this.data[id+"HEROIC_A"]){
				heroicid = id+"HEROIC_A";
			}else if(!this.isalliance && this.data[id+"HEROIC_H"]){
				heroicid = id+"HEROIC_H";
			}else
				heroicid = id+"HEROIC";
		}
		
		if(this.data[id+"25Man"] || this.data[id+"25Man_A"] || this.data[id+"25Man_H"]){
			if(this.isalliance && this.data[id+"25Man_A"]){
				normal25id = id+"25Man_A";
			}else if(!this.isalliance && this.data[id+"25Man_H"]){
				normal25id = id+"25Man_H";
			}else
				normal25id = id+"25Man";
		}

		if(this.data[id+"25ManHEROIC"] || this.data[id+"25ManHEROIC_A"] || this.data[id+"25ManHEROIC_H"]){
			if(this.isalliance && this.data[id+"25ManHEROIC_A"]){
				heroic25id = id+"25ManHEROIC_A";
			}else if(!this.isalliance && this.data[id+"25ManHEROIC_H"]){
				heroic25id = id+"25ManHEROIC_H";
			}else
				heroic25id = id+"25ManHEROIC";
		}
		
		
		//获取4个id,以下按照优先权顺序
		var allid = [[normalid, normal25id], [heroicid, heroic25id]];

		var loc0 = this.isheroic ? 1 : 0;
		var loc1 = this.is25man  ? 1 : 0;

		if(allid[loc0][loc1]){
			id = allid[loc0][loc1];
			buttontype[0] = allid[1-loc0][loc1] ? 1 : 0;
			buttontype[1] = allid[loc0][1-loc1] ? 1 : 0;
		}else if(allid[1-loc0][loc1]){
			id = allid[1-loc0][loc1];
			buttontype[0] = -1;
			buttontype[1] = allid[1-loc0][1-loc1] ? 1 : 0;
		}else if(allid[loc0][1-loc1]){
			id = allid[loc0][1-loc1];
			buttontype[0] = allid[1-loc0][1-loc1] ? 1 : 0;
			buttontype[1] = -1;
		}else{
			id = allid[1-loc0][1-loc1];
			buttontype = [-1, -1];
		}

		//下面的代码控制模式按钮的激活
		//if(buttontype[0] < 2){
			if(this.isheroic){
				this.hrc.innerHTML = "&nbsp;切换到普通模式&nbsp;";
			}else
				this.hrc.innerHTML = "&nbsp;切换到英雄模式&nbsp;";
			if(buttontype[0] < 1)
				addclass(this.hrc, "menupassive");
			else
				removeclass(this.hrc, "menupassive");
		//}else{
		//	if(this.isheroic){
		//		this.hrc.innerHTML = "英雄模式不可用";
		//	}else
		//		this.hrc.innerHTML = "普通模式不可用";
		//	addclass(this.hrc, "menupassive");
		//}

		//if(buttontype[1] < 2){
			if(this.is25man){
				this.man.innerHTML = "&nbsp;切换到10人模式&nbsp;";
			}else
				this.man.innerHTML = "&nbsp;切换到25人模式&nbsp;";
			if(buttontype[1] < 1)
				addclass(this.man, "menupassive");
			else
				removeclass(this.man, "menupassive");
		/*}else{
			if(this.is25man){
				this.man.innerHTML = "25人模式不可用";
			}else
				this.man.innerHTML = "10人模式不可用";
			addclass(this.man, "menupassive");
		}
		*/
		return id;
	},
	
	loadfavourite : function(f){
	//加载收藏
		al.favcache = {};
		al.tablenames["favourite"] = "收藏夹";
		//优先加载指定的xml文件
		//*
		if(f){
			f = xpath.findall(f, "/fav/list");
			for(var i=0; i<f.length && i<30; i++){
				var id    = f[i].getAttribute("id");
				var index = f[i].getAttribute("index");
				if(id && index){
					al.favcache[id+ ":" + index] = true;
				}
			}
		}else{
		//*/
			var f = (store.get("alfavourite") || '').split(" ");
			for(var i=0; i<f.length && i<30; i++){
				al.favcache[f[i]] = true;
			}
		}
		
		al.favchanged = true;
	},
	
	openfavourite : function(){
	//打开收藏表
		wowtip.hide();
		
		this.active = true;
		while(this.elm.firstChild)
			this.elm.removeChild(this.elm.firstChild);
		
		if(this.favchanged){
			var j = 0;
			al.data["favourite"] = [];
			for(var i in al.favcache){
				var id    = i.slice(0, i.lastIndexOf(":"));
				var index = i.slice(id.length+1);
				
				var l = al.data["favourite"][j] = al.data[id][index].slice(0);
				al[id+":"+index] = true;
				l[0] = ++j;
				if(/25ManHeroic/.test(id))
					l[5] = al.tablenames[id] + "(25H)";
				else if(/25Man/.test(id))
					l[5] = al.tablenames[id] + "(25)";
				else if(/Heroic/.test(id))
					l[5] = al.tablenames[id] + "(H)";
				else
					l[5] = al.tablenames[id];
				if(j >= 30)
					break;
			}
			var div = this.createpage("favourite");
		}else
			var div = this.cache["favourite"];
			
		this.elm.appendChild(div);
		this.cur.style.display = "block";

		loot.curprev.style.display = "none";
		loot.curnext.style.display = "none";

		this.man.style.display = "none";
		this.hrc.style.display = "none";		
	},
	
	savefavourite : function(){
		var f = [];
		for(var i in al.favcache){
			f.push(i);
		}
		store.set("alfavourite", f.join(" "));
	},
	
	addtofavourite : function(e, id, index){
	//添加
		if(!e.ctrlKey) return;
		al.favchanged = true;
		if(id === "favourite"){
			var j = 0;
			for(var i in al.favcache){
				if(j++ === index){
					delete al.favcache[i];
					al.openfavourite();
					al.savefavourite();
					break;
				}
			}
			
		}else{
			if(al.favcache[id+ ":" + index]){
				delete al.favcache[id+ ":" + index];
			}else
				al.favcache[id+ ":" + index] = true;
			al.savefavourite();
		}
	},
	
	outputfavourite : function(){
	//输出
		var a = ['<?xml version="1.0" encoding="gb2312"?>\n<fav>'];
		var j = 0;
		for(var i in al.favcache){
			var id    = i.slice(0, i.lastIndexOf(":"));
			var index = i.slice(id.length+1);
			
			a.push('<list id="' + id +'" index="' + index + '" />');
			if(++j >= 30)
				break;
		}
		a.push('</fav>');
		window.alert(a.join("\n"));
		wowmap.rightButtonClick = true;
	}
};
