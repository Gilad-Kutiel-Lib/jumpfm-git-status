import { JumpFm, Panel } from 'jumpfm-api'

import * as findParentDir from 'find-parent-dir'
import * as path from 'path'
import * as watch from 'node-watch'
import * as cmd from 'node-cmd'

class GitStatus {
    readonly panel: Panel
    root: string
    rootWatcher = { close: () => undefined }
    indexWatcher = { close: () => undefined }

    constructor(panel) {
        this.panel = panel
        panel.listen(this)
    }

    onPanelItemsSet = () => {
        console.log('on panel')

        const url = this.panel.getUrl()

        this.rootWatcher.close()
        this.indexWatcher.close()

        if (url.protocol) return
        this.root = findParentDir.sync(url.path, '.git')
        if (!this.root) return

        console.log('watching', this.root, path.join(this.root, '.git', 'index'))

        this.rootWatcher = watch(
            this.root
            , this.updateStatus
        )
        this.indexWatcher = watch(
            path.join(this.root, '.git', 'index')
            , this.updateStatus
        )

        this.updateStatus()
    }

    // see https://git-scm.com/docs/git-status
    readonly iCls = {
        '?': 'git-new'
        , '!': 'git-ignore'
        , 'D': 'git-rm'
        , 'A': 'git-add'
    }

    readonly wtCls = {
        'M': 'git-modified'
    }

    private status = (path: string, name: string, cb: (err, res) => void) => {
        cmd.get(`git -C "${path}" status --porcelain --ignored - ${name}`, cb)
    }

    updateStatus = () => {
        console.log('update')
        const path = this.panel.getPath()
        this.panel.getItems().forEach(item => {
            this.status(path, item.name, (err, res: string) => {
                console.log(res)
                if (res.length < 2) return
                const iCls = this.iCls[res.charAt(0)]
                const wtCls = this.wtCls[res.charAt(1)]
                item.classes = []
                if (iCls) item.classes.push(iCls)
                if (wtCls) item.classes.push(wtCls)
            })
        })
    }
}

export const css = ['index.css']
export const load = (jumpFm: JumpFm) => {
    jumpFm.panels.forEach(panel => new GitStatus(panel))
}


