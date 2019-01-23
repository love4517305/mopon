/*
注释：
<%# 这是注释 %>

包含文件，默认使用.ejs后缀，也可以指定别的
<% include ../common/header %>
<% include ../common/header.tpl %>

js脚本，一般是做条件判断什么的：
<% var i = 0; %>

输出值到模板，并且使用encodeHTML编码
<%= value %>

原样输出值到模板
<%- value %>

转义
<%%

结束标签
%>

结束标签并且不换行
-%>

循环:
<% list.forEach(function(item) { %>
    <li>名称：<%=item.name%></li>
<% }); %>

条件判断：
<% if(header != null && header.title != null) {%>
<h1><%=header.title%></h1>
<% } %>
*/
