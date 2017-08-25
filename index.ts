import { JumpFm, Panel, Item } from 'jumpfm-api'

import * as findParentDir from 'find-parent-dir'
import * as path from 'path'
import * as watch from 'node-watch'
import * as cmd from 'node-cmd'
import * as os from 'os'

const EOL = os.EOL
// see https://git-scm.com/docs/git-status
const indexStatus = {
    '?': 'new'
    , '!': 'ignore'
    , 'D': 'del'
    , 'A': 'add'
    , 'M': 'mod'
}

const workingTreeStatus = {
    'M': 'mod'
}

const status = (path: string, cb: (err, res) => void) => {
    // cmd.get(`git -C "${path}" status --porcelain --ignored - ${name}`, cb)
    cmd.get(`git -C "${path}" status --porcelain --ignored`, cb)
}


export const css = ['index.css']
export const load = (jumpFm: JumpFm) => {
    jumpFm.panels.forEach(panel => {
        panel.onLoad(() => {

            const updateStatus = () => {
                console.time('git')
                status(panel.getUrl().path, (err, res: string) => {
                    const files = {}
                    res.split(EOL).forEach(line => {
                        if (line.length < 2) return
                        const iStatus = indexStatus[line.charAt(0)]
                        const wtStatus = workingTreeStatus[line.charAt(1)]
                        const args = line.split(' ')
                        const name = args[args.length - 1]
                        if (files[name]) return
                        files[name] = [iStatus, wtStatus]
                    })
                    console.log(files)
                    panel.getItems().forEach(item => {
                        item
                            .setAttribute('git-index', '')
                            .setAttribute('git-wt', '')

                        const status = files[item.name]
                        if (!status) return
                        const [index, wt] = status
                        if (index) item.setAttribute('git-index', index)
                        if (wt) item.setAttribute('git-wt', wt)
                    })
                })
                console.timeEnd('git')
            }

            const url = panel.getUrl()

            jumpFm.watchStop('git-root')
            jumpFm.watchStop('git-git')

            if (url.protocol) return
            const root = findParentDir.sync(url.path, '.git')
            if (!root) return

            const p = panel.getUrl().path
            console.log('watching', root, path.join(root, '.git'))
            jumpFm.watchStart('git-root', root, this.updateStatus)
            jumpFm.watchStart('git-git', root, this.updateStatus)
            console.log('update')
            updateStatus()
        })
    })
}


