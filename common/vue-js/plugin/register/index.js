import Vue from 'vue'
import grid from 'vs/plugin/grid'
import tree from 'vs/plugin/tree'
import page from 'vs/plugin/page'
import search from 'vs/plugin/search'
import select from 'vs/plugin/select'
import ldSelect from 'vs/plugin/ldSelect'
import checkbox from 'vs/plugin/checkbox'
import radio from 'vs/plugin/radio'
import calendar from 'vs/plugin/calendar'
import button from 'vs/plugin/button'
import diyajax from 'vs/plugin/utils/diyajax'
import lazyImage from 'vs/plugin/lazyImage'

Vue.config.productionTip = false;
Vue.prototype.$http = diyajax;
Vue.use(grid);
Vue.use(tree);
Vue.use(page);
Vue.use(search);
Vue.use(select);
Vue.use(ldSelect);
Vue.use(checkbox);
Vue.use(radio);
Vue.use(calendar);
Vue.use(button);
Vue.use(lazyImage);

