/**
 * Created by 邹美婷 on 2018/6/29.
 * 参考链接：https://www.froala.com/wysiwyg-editor/docs/options
 * 编辑器版本 v2.8.4
 * 完整编辑器插件代码SVN http://172.16.9.244/svn/front/ria/常用组件/froalaEditor
 * 
 */

module.exports = function(width, height,toolbars) {
    toolbars = toolbars||[];
    return {
        toolbarSticky: false,
        width:width || 622,
        height: height || 200,
        autosave: true,
        useClasses: true,
        // placeholderText: '',
        pastePlain: true,//'将内容粘贴到富文本编辑器时删除文本格式',但保留内容的结构。
        pasteAllowLocalImages: false, 
        pasteAllowedStyleProps: ['font-size', 'color', 'width'],
        imageDefaultAlign: 'left',
        imageDefaultDisplay: 'inline',
        imageDefaultWidth: 0,
        fontSizeDefaultSelection:'12',
        //imageStyles:{'border':'1px solid #999'},
        fontSizeSelection: true,//编辑器工s具栏中的字体大小按钮将替换为显示当前文本选择的实际字体大小值的下拉列表。
        fontSize: ['8', '9', '10', '11', '12', '14', '15','16','18','20', '24', '30', '36', '48', '60', '72', '96'],
        fontFamilySelection: true,//编辑器工具栏中的字体系列按钮将替换为显示当前文本选择的实际字体系列名称的下拉列表。
        paragraphFormatSelection: true,//编辑器工具栏中的段落格式按钮将替换为显示当前文本选择的实际段落格式名称的下拉列表。
        toolbarStickyOffset: 20,//粘滞工具栏从页面顶部的偏移量。
        imageEditButtons:["imageReplace","imageAlign","imageCaption","imageRemove","|","imageLink","linkOpen","linkEdit","linkRemove","-","imageDisplay","imageAlt","imageSize"],
        toolbarButtons: ['fullscreen', '|', 'selectAll','insertLink','|', 'quote', 'insertHR', 'subscript', 'superscript', 'undo', 'redo', '-', 'bold', 'italic', 'underline', 'strikeThrough', '|', 'fontFamily', '|', 'fontSize', '|', 'color', 'inlineStyle', '-', 'paragraphFormat', '|', 'paragraphStyle', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'clearFormatting'].concat(toolbars),
        pluginsEnabled: ['align','charCounter','codeBeautifier','codeView','colors','draggable','embedly','emoticons','entities','fontFamily','fontSize','fullscreen','image','imageManager','inlineStyle','lineBreaker','link','lists','paragraphFormat','paragraphStyle','quote','save','table','url','wordPaste'],
        tableInsertHelper:false,//通过转到表格的边缘可以更轻松地插入行和列。
        tableResizerOffset:10 ,//与表格单元的左侧或右侧边框之间的距离，以像素为单位显示调整器。
        tableEditButtons:[ 'tableRows','tableColumns','tableCells','tableCellVerticalAlign','tableRemove' ,'tableCellBackground','tableHeader','cell'],
        language: 'zh_cn'
    }
}