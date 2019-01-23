/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/common/dist/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./branches/cloud-collect/common/js/plugin/theme/main.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./branches/cloud-collect/common/js/plugin/theme/main.js":
/*!***************************************************************!*\
  !*** ./branches/cloud-collect/common/js/plugin/theme/main.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("/***********\r\n * 皮肤管理集合\r\n * by: 璩\r\n */\n(function (href) {\n    var themeUtils = {\n        skin: \"cloud-let\",\n        path: \"./login/dist/\",\n        pathMap: {\n            '203.195.128.135:8288': 'cloud-let', //兜有云生产\n            'fcloud.mopon.cn:8288': 'cloud-let', //兜有云生产\n            '172.16.10.38': 'cloud-let', //兜有准生产\n            '172.16.10.55:41': 'cloud-let', //兜有云测试\n            'cloud.cfc.com.cn': 'cloud-zy', //中影云生产\n            '172.16.10.55:40': 'cloud-zy', //中影云测试\n            'cloud.omnijoi.cn': 'cloud-xflh', //福泰云生产\n            'ftypre.omnijoi.cn': 'cloud-xflh', //福泰准生产\n            '172.16.10.55:61': 'cloud-xflh' //福泰云测试\n        },\n        setSkin: function () {\n            var obj = this.getParse(href);\n            if (this.pathMap[obj.host]) {\n                this.skin = this.pathMap[obj.host];\n            }\n        },\n        createScript: function (url) {\n            var script = document.createElement(\"script\");\n            script.type = \"text/javascript\";\n            script.src = this.path + url + this.timestamp();\n            document.getElementsByTagName(\"head\")[0].appendChild(script);\n        },\n        getParse: function (url) {\n            var link = document.createElement(\"A\");\n            link.href = url;\n\n            return {\n                \"url\": url,\n                \"scheme\": link.protocol,\n                \"host\": link.host,\n                \"port\": link.port,\n                \"path\": link.pathname\n            };\n        },\n        includes: function (code) {\n            return href.indexOf(code) > -1;\n        },\n        timestamp: function () {\n            return \"?ver=\" + new Date().getTime();\n        },\n        config: {\n            login: {\n                \"cloud-zy\": \"login.js\",\n                \"cloud-ng\": \"cloudng/login.js\",\n                \"cloud-let\": \"cloudlet/login.js\",\n                \"cloud-xflh\": \"xflhLogin/login.js\",\n                \"cloud-freely\": \"cloudfreely/login.js\",\n                \"cloud-hq\": \"cloudhq/login.js\",\n                \"cloud-my\": \"cloudmy/login.js\"\n            },\n            nav: {\n                \"cloud-zy\": \"nav.js\",\n                \"cloud-ng\": \"cloudng/nav.js\",\n                \"cloud-let\": \"cloudlet/nav.js\",\n                \"cloud-xflh\": \"xflhLogin/nav.js\",\n                \"cloud-freely\": \"cloudfreely/nav.js\",\n                \"cloud-hq\": \"cloudhq/nav.js\",\n                \"cloud-my\": \"cloudmy/nav.js\"\n            }\n        },\n        init: function () {\n            this.setSkin();\n            document.body.className = this.skin;\n            if (this.includes(\"login.html\") || !this.includes(\".html\")) {\n                this.createScript(this.config.login[this.skin]);\n            } else if (this.includes(\"nav.html\")) {\n                this.createScript(this.config.nav[this.skin]);\n            } else if (this.includes(\"frame.html\")) {} else if (this.includes(\"proxy.html\")) {}\n        }\n    };\n    themeUtils.init();\n    module.exports = themeUtils.skin;\n})(window.location.href);\n\n//# sourceURL=webpack:///./branches/cloud-collect/common/js/plugin/theme/main.js?");

/***/ })

/******/ });