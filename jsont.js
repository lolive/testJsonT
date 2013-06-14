/*	This work is licensed under Creative Commons GNU LGPL License.

	License: http://creativecommons.org/licenses/LGPL/2.1/
   Version: 0.9
	Author:  Stefan Goessner/2006
	Web:     http://goessner.net/ 
*/

function jsonT(self, rules) {
   var T = {
      output: false,
      init: function() {
         for (var rule in rules)
            if (rule.substr(0,4) != "self")
               rules["self."+rule] = rules[rule];
         return this;
      },
      apply: function(expr) {
         var trf = function(s){ 
			return s.replace(/{([A-Za-z0-9_\$\.\[\]\'@\(\)]+)}/g, 
                                  function($0,$1){
					return T.processArg($1, expr);
                                  }
                               )
                   },
             x = expr.replace(/\[[0-9]+\]/g, "[*]"), 
             res;
         var rulex = rules[(function ruleBestMatchingX(){ //Let's find the rule matching the current JSON path.
			return Object.keys(rules)
			.filter(function rulesEndingByX
			 (ruleName){
			 return (x.match(ruleName+'$')?true:false)})
			.sort(function longestFirst
			 (ruleName1, ruleName2)
			 {return ruleName1.length<ruleName2.length})
			[0] })()];
	if (rulex) {
            if (typeof(rulex) == "string")
               res = trf(rulex);
            else if (typeof(rulex) == "function"){
		var evalexpr=eval(expr);
		var ruling = rulex(evalexpr).toString();
               res = trf(ruling);
	    }
         }
         else 
            res = T.eval(expr);
         return res;
      },
      processArg: function(arg, parentExpr) {
         var expand = 	function(a,e){
                                var ee=a.replace(/^\$/,e);
				return ee.substr(0,4)!="self" ? ("self."+ee) : ee; 
			},
             res = "";
         T.output = true;
         if (arg.charAt(0) == "@"){
	var argreplace = arg.replace(/@([A-za-z0-9_]+)\(([A-Za-z0-9_\$\.\[\]\']+)\)/, 
                                   function($0,$1,$2){
                                        var rulename = 'self."+$1+"';
                                        var rule =rules[rulename]; 
                                        var argument = expand($2,parentExpr);
					return "rules['self."+$1+"']("+expand($2,parentExpr)+")";
					}
                      );	
            res = eval(argreplace);
         } else if (arg != "$"){
	    var expandarg=expand(arg, parentExpr);
            res = T.apply(expandarg);
	  }
         else
            res = T.eval(parentExpr);
         T.output = false;
         return res;
      },
      eval: function(expr) {
         var v = eval(expr), 
         res = "";
         if (typeof(v) != "undefined") {
            if (v instanceof Array) {
               for (var i=0; i<v.length; i++)
                  if (typeof(v[i]) != "undefined"){
		     var expri = expr+"["+i+"]";
                     res += T.apply(expri);
		  }
            }
            else if (typeof(v) == "object") {
               for (var m in v)
                  if (typeof(v[m]) != "undefined"){
		     var exprm = expr+"."+m;
                     res += T.apply(exprm);
                  }
            }
            else if (T.output)
               res += v;
         }
         return res;
      }
   };
   return T.init().apply("self");
}

