/**
 * Created by TIAN on 2017/12/20.
 */
import http from 'vs/plugin/utils/diyajax'
import storage from 'vlib/util/storage'
import api from 'vs/api'

export default function () {
    return http.get(api.authenticate, {
        id: storage.get(api.const.MENUID),
        appId: storage.get(api.const.APPID)
    });
}