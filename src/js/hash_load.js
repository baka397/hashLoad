/**
 * hashLoad是一个移动端的页面异步加载插件
 * 依赖：zepto.js(1.1.6),touch.js(zepot，如果没有touch，则监听click事件)
 * 创建：2015-12-01
 * 更新：
 * 2015-12-02 v1.0.1 修复加载页面中js文件在zepto中引入失效的问题；修复定时器BUG；为防止全局污染，新增runScript（以及unScript）方法；
 */
;(function(){
	/**
	 * hashLoad主程序
	 * @param  {object} option hashLoad设置参数
	 */
	function hashLoad(option){
		this.option={
			load:'switch',//默认加载类型
			tab:'switch',//默认tab切换类型
			target:document,//默认加载页面的dom对象
			cache:false//页面缓存
		}
		this.option=$.extend(this.option,option);
		this.order=0;//页面顺序
		this._prev_url='';//上次加载的页面地址
		this._prev_tab='';//上次加载的tab名
		this._timer={
			_tab_timer:null,
			_load_timer:null
		}
	}
	hashLoad.prototype={
		/**
		 * 获取hash参数
		 * @param  {string} name 参数名称
		 * @return {string}      参数值
		 */
		_getHashParam:function(hash,name){
		    var reg=new RegExp("(#|&)"+ name +"=([^&]*)(&|$)");
		    var r=hash.match(reg);
		    if(r!=null) return decodeURI(r[2]);
		    return '';
		},
		/**
		 * 解析HTML内容
		 * @param  {string} html 解析HTML内容
		 * @return {object}      HTML对象
		 */
		_parse:function(html){
			var page,
			all=$('<div></div>');
			//建立一个工作区解析HTML内容，并让引入的script执行
			all.get(0).innerHTML = html;
			page = all.find('[data-role="page"]').children();
			return page;
		},
		_include:function(page,element){
			var self=this;
			element.html(page);
			//对zepto没有处理html的script标签问题进行加载，会在页面内script执行前执行。
			if(window.Zepto){
				//检测是否有javascript文件引入,如果有，则模拟浏览器加载js行为
				for(var i in page.selector){
					if(page.selector[i].nodeName.toLowerCase()==='script'&&page.selector[i].src){
						self._loadScript(page.selector[i].src);
					}
				}
			}
		},
		_loadScript:function(url){
			$.ajax({
				async:false,
				url:url
			});
		},
		/**
		 * 初始化方法
		 */
		init:function(){
			var self=this,
			option=this.option,
			action='click';
			if($.fn.tap){//for zepto touch
				action='tap';
			}
			$(document).on(action,'a',function(){
				var href=$(this).attr('href');
				//检测ajax选项是否关闭或者为特殊的链接（以javascript:开头，单个#，或者空链接）时，不执行hash操作
				if($(this).attr('data-ajax')!='false'&&!href.match(/^(javascript\:|#$|$)/)){
					var url=href,
					load_type=$(this).attr('data-hash-load')||self.option.load,//load类型
					tab_type=$(this).attr('data-hash-tab')||self.option.tab,
					cache=$(this).attr('data-hash-cache')||self.option.cache;//缓存
					self.setHash(url,load_type,tab_type,cache);
					return false;
				}
			});
			if(action==='tap'){
				//屏蔽a标签点击事件
				$(document).on('click','a',function(){
					var href=$(this).attr('href');
					if($(this).attr('data-ajax')!='false'&&!href.match(/^(javascript\:|#$|$)/)){
						return false;
					}
				});
			}
			//初始化hash监测
			if(window.location.hash){
				self.analysisHash();
			}
			//监听hash变更事件
			window.onhashchange=function(){
				self.analysisHash();
			}
		},
		/**
		 * 设置hash值
		 * @param {string} location  url的location值
		 * @param {string} load_type load执行函数
		 * @param {string} tab_type  tab执行函数
		 * @param {boolen} cache     是否启用缓存
		 */
		setHash:function(location,load_type,tab_type,cache){
			var self=this,
			hash=window.location.hash;
			order=self.order+1,
			tab='',
			url='',
			reg=new RegExp(/^([^\#]*)(\#[^\#]+|)$/),
			r=location.match(reg);
			url=r[1]||self._getHashParam(hash,'url');
			tab=r[2]||'';
			tab=tab.replace('#','');
			if(url===self._prev_url&&tab===self._prev_tab) return false;
			window.location.hash='url='+url+'&tab='+tab+'&load_type='+load_type+'&tab_type='+tab_type+'&order='+order+'&cache='+cache;
		},
		/**
		 * 扩展加载方法
		 * @param  {string} type tab/load
		 * @param  {object} list 需要扩展的加载方法
		 */
		updateFunc:function(type,list){
			var self=this;
			if(type!='tab'||type!='load'){
				throw '没有这个扩展方法类型';
				return false;
			}
			self['_'+type+'_func']=$.extend(self['_'+type+'_func'],list);
		},
		/**
		 * js重定向方法
		 * @param  {string} url       链接地址
		 * @param  {string} load_type load执行函数
		 * @param  {string} tab_type  tab执行函数
		 * @param  {boolen} cache     是否启用缓存
		 */
		location:function(url,load_type,tab_type,cache){
			var self=this,
			hash=window.location.hash,
			location_url=url,
			location_load_type=load_type||self.option.load,
			location_tab_type=tab_type||self.option.tab,
			location_cache=cache||self.option.cache;
			if(!url){
				throw '没有设置url';
				return false;
			}
			self.setHash(location_url,location_load_type,location_tab_type,location_cache);
		},
		/**
		 * 分析hash链接
		 */
		analysisHash:function(){
			var self=this,
			hash=window.location.hash,
			url=self._getHashParam(hash,'url'),
			type=1,
			tab=self._getHashParam(hash,'tab'),
			load_type=self._getHashParam(hash,'load_type'),
			tab_type=self._getHashParam(hash,'tab_type'),
			order=self._getHashParam(hash,'order'),
			cache=self._getHashParam(hash,'cache');
			$(window).trigger('hashChangeInfo',[url,tab,load_type,tab_type,order,cache]);
			if(url!==self._prev_url){
				type=0;
				self._prev_url=url;
			}
			self._prev_tab=tab;
			if(tab){
				self.tab(type);
			}else{
				self.load();
			}
		},
		/**
		 * 标签切换方法
		 */
		tab:function(type){
			var self=this,
			hash=window.location.hash,
			url=self._getHashParam(hash,'url'),
			tab='#'+self._getHashParam(hash,'tab'),
			tab_type=self._getHashParam(hash,'tab_type')||self.option.tab,
			order=parseInt(self._getHashParam(hash,'order'))||this.order;
			if(type===1){
				setTab(tab);
			}else{
				self.load(function(){
					setTab(tab);
				});
			}
			this.order=order;
			function setTab(tab){
				if(self._tab_func[tab_type]){
					$(tab).trigger('pageBeforeLoaded');
					self._tab_func[tab_type].call(self,tab,{
						'hashTabBeforeShow':function(){//page加载事件
							$(tab).trigger('hashTabBeforeShow');
						},
						'hashTabShow':function(){//page加载事件
							$(tab).trigger('hashTabShow');
						},
						'hashTabHide':function(tab){//page加载事件
							tab.trigger('hashTabHide');
						}
					});
				}else{
					throw '没有名为"'+tab_type+'"的tab函数';
				}
			}
		},
		/**
		 * tab切换方法列表
		 * @type {Object}
		 */
		_tab_func:{
			/**
			 * 隐藏显示，点击后显示对应标签页，隐藏同级的标签页
			 * @param  {string}   target   目标ID
			 * @param  {Function} callback 回调函数
			 */
			'display':function(target,callback){
				callback['hashTabHide'].call(this,$(target).siblings('.hash-tab.cur'));
				callback['hashTabBeforeShow'].call();
				$(target).siblings('.hash-tab').removeClass('cur');
				$(target).addClass('cur');
				callback['hashTabShow'].call();
			},
			/**
			 * 切换显示，根据tab所处位置，动态左右切换
			 * @param  {string}   target   目标ID
			 * @param  {Function} callback 回调函数
			 */
			'switch':function(target,callback){
				var self=this;
				if(self._timer._tab_timer) return false;
				callback['hashTabBeforeShow'].call();
				var parent=$(target).parent();
				var prev=$(target).prevAll('.cur');
				var next=$(target).nextAll('.cur');
				if(prev.length===0&&next.length===0){
					$(target).addClass('cur');
					callback['hashTabShow'].call();
				}
				//从右划入
				else if(prev.length>0){
					callback['hashTabHide'].call(this,prev);
					parent.addClass('hash-tab-in');
					$(target).addClass('active');
					self._timer._tab_timer=setTimeout(function(){
						parent.removeClass('hash-tab-in');
						prev.removeClass('cur');
						$(target).removeClass('active').addClass('cur');
						callback['hashTabShow'].call();
						self._timer._tab_timer=null;
					},1000);
				}
				//从左划出
				else if(next.length>0){
					callback['hashTabHide'].call(this,next);
					parent.addClass('hash-tab-out');
					$(target).addClass('active');
					self._timer._tab_timer=setTimeout(function(){
						parent.removeClass('hash-tab-out');
						next.removeClass('cur');
						$(target).removeClass('active').addClass('cur');
						callback['hashTabShow'].call();
						self._timer._tab_timer=null;
					},1000);
				}
			}
		},
		/**
		 * 加载页面方法
		 */
		load:function(callback){
			var self=this,
			hash=window.location.hash,
			url=self._getHashParam(hash,'url'),
			load_type=self._getHashParam(hash,'load_type')||self.option.load,
			order=parseInt(self._getHashParam(hash,'order'))||this.order,
			action=order>=this.order?'forward':'back',
			cache=self._getHashParam(hash,'cache')==='true'?true:false,
			target=self.option.target;
			if(!url){
				window.location.reload();
				return false;
			}
			if(!cache){
				if(/\?/.test(url)){
					url+='&timestamp='+new Date().getTime();
				}else{
					url+='?timestamp='+new Date().getTime();
				}
			}
			this.order=order;
			if(self._load_func[load_type]){
				$(target).trigger('pageBeforeLoaded');
				self._load_func[load_type].call(self,url,target,action,{
					'hashPageLoaded':function(){//page加载事件
						$(target).trigger('hashPageLoaded');
					},
					'hashPageCreated':function(){//page加载事件
						if(callback) callback.call();
						$(target).trigger('hashPageCreated');
					},
					'hashPageShow':function(){//page加载事件
						$(target).trigger('hashPageShow');
					},
					'hashPageUnload':function(){//page加载事件
						$(window).trigger('hashPageUnload');
					}
				});
			}else{
				throw '没有名为"'+load_type+'"的load函数';
			}
		},
		/**
		 * ajax加载方法列表
		 * @type {Object}
		 */
		_load_func:{
			/**
			 * page加载方法，弹出loading窗口，当加载完成后隐藏loading窗口
			 * @param  {string}   url      加载地址
			 * @param  {object}   target   加载目标
			 * @param  {string}   action   forward/back，该动作是前进还是后退
			 * @param  {Function} callback 回调函数列表，执行对应的回调操作
			 */
			'page':function(url,target,action,callback){
				$('#hash-loading').show();
				var self=this;
				callback['hashPageUnload'].call();
				$.get(url,function(data){
					//数据加载完成
					callback['hashPageLoaded'].call();
					if($(target).find('.hash-page')===0) $(target).html('<div class="hash-page" data-role="page"></div>');
					content=self._parse(data);
					self._include(content,$(target).find('.hash-page'));
					//数据渲染完成
					callback['hashPageCreated'].call();
					$('#hashload-loading').hide();
					//数据展示完成
					callback['hashPageShow'].call();
				});
			},
			/**
			 * 标签切换式方法，当action为forward时，右侧切入loading框，加载loading内容。当action为back时，左侧切入loading框，加载loading内容。须配合样式
			 * @param  {string}   url      加载地址
			 * @param  {object}   target   加载目标
			 * @param  {string}   action   forward/back，该动作是前进还是后退
			 * @param  {Function} callback 回调函数列表，执行对应的回调操作
			 */
			'switch':function(url,target,action,callback){
				var self=this;
				if(self._timer._load_timer) return false;
				callback['hashPageUnload'].call();
				var load_html='<div class="hash-page-load-con"><div class="spinner"><div class="spinner-container container1"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container2"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container3"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div></div></div>';
				if($(target).find('.hash-page').length===1){
					//生成切换数据
					switch(action){
						case 'forward':
						$(target).append('<div class="hash-page hash-page-load" data-role="page">'+load_html+'</div>');
						$(target).addClass('hash-page-in');
						self._timer._load_timer=setTimeout(function(){
							$(target).removeClass('hash-page-in').find('.hash-page').eq(0).remove();
							self._timer._load_timer=null;
						},1000);
						break;
						case 'back':
						$(target).prepend('<div class="hash-page hash-page-load" data-role="page">'+load_html+'</div>');
						$(target).addClass('hash-page-out');
						self._timer._load_timer=setTimeout(function(){
							$(target).removeClass('hash-page-out').find('.hash-page').eq(1).remove();
							self._timer._load_timer=null;
						},1000);
						break;
					}
				}else{
					//直接载入数据
					$(target).append('<div class="hash-page hash-page-load" data-role="page">'+load_html+'</div>');
				}
				$.get(url,function(data){
					var content;
					//数据加载完成
					callback['hashPageLoaded'].call();
					content=self._parse(data);
					self._include(content,$(target).find('.hash-page-load'));
					//数据渲染完成
					callback['hashPageCreated'].call();
					$(target).find('.hash-page-load').removeClass('hash-page-load');
					//数据展示完成
					callback['hashPageShow'].call();
				});
			}
		},
		/**
		 * 执行javascript函数，防止全局作用域污染，并且
		 * @param  {Function} callback 回调函数
		 */
		runScript:function(callback){
			if(callback) callback.call();
		},
		unScript:function(callback){
			if(!callback) return false;
			$(window).one('hashPageUnload',function(){
				callback.call();
			});
		}
	}
	window.hashLoad=hashLoad;
})(window);

/**
 * 封装prevAll&nextAll
 */
if(window.Zepto){
	;(function($){
		if(!$) return false;
		var e = {
		    nextAll: function(s) {
		        var $els = $(), $el = this.next();
		        while( $el.length ) {
		            if(typeof s === 'undefined' || $el.is(s)) $els = $els.add($el);
		            $el = $el.next();
		        }
		        return $els;
		    },
		    prevAll: function(s) {
		        var $els = $(), $el = this.prev();
		        while( $el.length ) {
		            if(typeof s === 'undefined' || $el.is(s)) $els = $els.add($el);
		            $el = $el.prev();
		        }
		        return $els;
		    }
		}
		$.extend($.fn,e);
	})(Zepto);
}