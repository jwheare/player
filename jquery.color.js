(function(_1){
_1.each(["backgroundColor","borderBottomColor","borderLeftColor","borderRightColor","borderTopColor","color","outlineColor"],function(i,_2){
_1.fx.step[_2]=function(fx){
if(fx.state==0){
fx.start=_3(fx.elem,_2);
fx.end=_4(fx.end);
}
fx.elem.style[_2]="rgb("+[Math.max(Math.min(parseInt((fx.pos*(fx.end[0]-fx.start[0]))+fx.start[0]),255),0),Math.max(Math.min(parseInt((fx.pos*(fx.end[1]-fx.start[1]))+fx.start[1]),255),0),Math.max(Math.min(parseInt((fx.pos*(fx.end[2]-fx.start[2]))+fx.start[2]),255),0)].join(",")+")";
};
});
function _4(_5){
var _6;
if(_5&&_5.constructor==Array&&_5.length==3){
return _5;
}
if(_6=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(_5)){
return [parseInt(_6[1]),parseInt(_6[2]),parseInt(_6[3])];
}
if(_6=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(_5)){
return [parseFloat(_6[1])*2.55,parseFloat(_6[2])*2.55,parseFloat(_6[3])*2.55];
}
if(_6=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(_5)){
return [parseInt(_6[1],16),parseInt(_6[2],16),parseInt(_6[3],16)];
}
if(_6=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(_5)){
return [parseInt(_6[1]+_6[1],16),parseInt(_6[2]+_6[2],16),parseInt(_6[3]+_6[3],16)];
}
return _7[_1.trim(_5).toLowerCase()];
};
function _3(_8,_9){
var _a;
do{
_a=_1.curCSS(_8,_9);
if(_a!=""&&_a!="transparent"||_1.nodeName(_8,"body")){
break;
}
_9="backgroundColor";
}while(_8=_8.parentNode);
return _4(_a);
};
var _7={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0]};
})(jQuery);

