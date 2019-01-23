/**
 * XML辅助工具 不支持IE11!
 */
var that = module.exports = {
    parseFromString: function(xml) {
        var xmlDoc = null;

        if (window.DOMParser) {
            xmlDoc = (new DOMParser()).parseFromString(xml, "text/xml");
            console.log(xmlDoc);
        } else{
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.loadXML(xml);
        }

        return xmlDoc;
    },
    serialize: function(node) {
        var serializer = null;

        if (window.XMLSerializer) {
            serializer = new XMLSerializer();
            return serializer.serializeToString(node);
        } else {
            return node.xml;
        }
    },
    selectNodes: function(xmlDoc, xpath) {
        var evaluator = null;
        var result = null;
        var node = null;
        var list = null;

        if (window.XPathEvaluator) {
            list = [];
            evaluator = new XPathEvaluator();

            try {
                result = evaluator.evaluate(xpath, xmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            } catch(ex) {
                console.log("XPath语法出错，查询失败！(" + xpath + ")")
            }

            while(node = result.iterateNext()) {
                list.push(node);
            }

            return list;
        } else {
            return Array.prototype.slice.call(xmlDoc.selectNodes(xpath), 0);
        }
    },
    encodeXQuery: function(xQuery) {
        return xQuery.replace(/'/g, "\\\'")
            .replace(/"/g, "\\\"");
    }
}