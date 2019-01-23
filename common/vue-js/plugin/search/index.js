import betweenCalendar from './betweenCalendar.vue'
import calendar from './calendar.vue'
import input from './input.vue'
import search from './search.vue'
import select from './select.vue'
import ldSelect from './ldSelect.vue'
import radio from './radio.vue'
import timeScope from './timeScope.vue'

const plugin = {
    install (Vue) {
        Vue.component('search-group', search);
        Vue.component('search-calendar', calendar);
        Vue.component('search-calendar-between', betweenCalendar);
        Vue.component('search-select', select);
        Vue.component('search-ld-select', ldSelect);
        Vue.component('search-input', input);
        Vue.component('search-radio', radio);
        Vue.component('search-time-scope', timeScope);
    }
};

export default plugin;