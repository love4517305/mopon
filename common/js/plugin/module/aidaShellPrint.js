import dialogManager from 'vs/plugin/dialog'
import printTableHeadRender from  'plugin/tmpl/print.ejs'
import insertHTML from  'lib/dom/insertHTML'

export const printHtmlContent = (option = {}) => {
    if(!top.aidaShell){
        return dialogManager.error("无法读取打印机！");
    }

    option = Object.assign({
        columns: [],
        gridTpl: null
    }, option);

	let frame = document.createElement("iframe");
    const frame_id = 'print_preview_'+new Date().getTime();
    frame.id = frame_id;
    frame.frameBorder = 0;
    frame.width = '100%';
    frame.height = '100%';
    frame.style.display = 'none';
    top.document.body.appendChild(frame);

    let link = document.createElement("link");
    link.setAttribute("rel", "stylesheet"); 
    link.setAttribute("type", "text/css"); 
    link.setAttribute("href", 'common/js/plugin/scss/print.css'); 
    frame.contentWindow.document.head.appendChild(link);
    
    let gridHeadHtml = printTableHeadRender(option);
    frame.contentWindow.document.body.innerHTML = option.gridTpl;
    insertHTML(frame.contentWindow.document.body.querySelector('tbody'), gridHeadHtml, 'afterbegin');
    
    if(top.frames[frame_id]) {
        let tid = setTimeout(function(){
            clearTimeout(tid);
            top.aidaShell.printHtmlContent(top.frames[frame_id].contentWindow.document.documentElement.outerHTML, top.document.URL);
            top.document.body.removeChild(top.frames[frame_id]);
            frame = null;
            // frame.contentWindow.parent.aidaShell.printCurrentPage(frame.contentWindow);
        }, 10);
    }
};