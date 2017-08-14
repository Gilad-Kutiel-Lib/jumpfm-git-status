import * as findParentDir from 'find-parent-dir'
import * as path from 'path'
import * as watch from 'node-watch'

class GitStatus {
    readonly nodegit
    readonly panel
    root: string
    rootWatcher = { close: () => undefined }
    indexWatcher = { close: () => undefined }

    constructor(nodegit, panel) {
        this.nodegit = nodegit
        this.panel = panel
        panel.listen(this)
    }

    onPanelItemsSet = () => {
        const url = this.panel.getUrl()

        this.rootWatcher.close()
        this.indexWatcher.close()

        if (url.protocol) return
        this.root = findParentDir.sync(url.path, '.git')
        if (!this.root) return
        console.log('watching', this.root)

        this.rootWatcher = watch(this.root, this.updateStatus)
        this.indexWatcher = watch(
            path.join(this.root, '.git', 'index'),
            this.updateStatus
        )

        this.updateStatus()
    }

    readonly classes = [
        'git-index-new',
        'git-index-modified',
        'git-index-deleted',
        'git-index-renamed',
        'git-index-typechange',
        'git-no-status',
        'git-no-status',
        'git-wt-new',
        'git-wt-modified',
        'git-wt-deleted',
        'git-wt-typechange',
        'git-wt-renamed',
        'git-wt-unreadable',
        'git-no-status',
        'git-ignored',
        'git-conflicted',
    ]

    private getClasses = (mask: number) => this.classes
        .filter((cls, i) => mask & (1 << i))

    updateStatus = () => {
        this.nodegit.Repository.open(this.root)
            .then(repo => {
                this.panel.getItems().forEach(item => {
                    item.classes = []
                    const status = this.nodegit.Status.file(
                        repo,
                        path.relative(this.root, item.path)
                    )
                    item.classes.push(...this.getClasses(status))
                })
            })
    }
}

export const css = ['index.css']
export const load = (jumpFm) => {
    jumpFm.panels.forEach(panel => new GitStatus(jumpFm.nodegit, panel))
}
