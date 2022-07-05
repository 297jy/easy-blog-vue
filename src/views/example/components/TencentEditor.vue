<template>
  <div>
    <div style="border-bottom: 1px solid #e8e8e8;">
      <Toolbar
        id="editor-toolbar"
        style="border-bottom: 1px solid #ccc"
        :editor="editor"
        :defaultConfig="toolbarConfig"
      />
    </div>
    <div id="content">
      <div style="margin-left: 50px;float: left;position: absolute;width: 15%">
        <el-button @click="updateArticle" v-loading="updateButtonLoading" class="el-button--success" style="margin-bottom: 20px">
          保存
        </el-button>
        <!--
        <div style="border-bottom: 1px solid #e8e8e8;height: 40px;line-height: 40px;position: relative;width: 100%">
          大纲
        </div>
        <el-tree :data="data" :props="defaultProps" :filter-node-method="filterNode" ref="tree"></el-tree>-->
      </div>
      <div id="editor-container">
        <div id="title-container">
          <label>
            <input placeholder="请输入标题" v-model="postForm.title">
          </label>
        </div>
        <!-- 编辑器 -->
        <Editor
          id="editor-text-area"
          :defaultConfig="editorConfig"
          v-model="postForm.content"
          ref="test"
          @onChange="onChange"
          @onCreated="onCreated"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { fetchArticle, saveArticle, tmpSaveArticle } from '@/api/article'
import { fetchSystemSetting } from '@/api/user'

/**
 import { DomEditor } from '@wangeditor/editor'
 //获取toolbar对象
 const toolbar = DomEditor.getToolbar(this.editor)
 console.log(toolbar.getConfig().toolbarKeys)
 **/

const defaultForm = {
  status: 'draft',
  title: '', // 文章题目
  content: '', // 文章内容
  content_short: '', // 文章摘要
  source_uri: '', // 文章外链
  image_uri: '', // 文章图片
  publishTime: undefined, // 前台展示时间
  keyWords: '', // 关键词
  id: undefined,
  platforms: ['a-platform'],
  comment_disabled: false,
  importance: 0
}

export default {
  name: 'TencentEditor',
  components: { Editor, Toolbar },
  props: {
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      autoSaveInterval: 60,
      lastChangeTime: null,
      updateButtonLoading: false,
      postForm: Object.assign({}, defaultForm),
      lastHeight: null,
      editor: null,
      html: '',
      toolbarConfig: {
        /* 显示哪些菜单，如何排序、分组 */
        toolbarKeys: [
          'undo', 'redo', 'clearStyle', '|', 'headerSelect', 'fontSize', 'bold', 'italic', 'through',
          {
            key: 'group-more-style', // 必填，要以 group 开头
            title: '更多文本样式', // 必填
            iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M204.8 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M505.6 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M806.4 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path></svg>', // 可选
            menuKeys: ['sup', 'sub', 'code'] // 下级菜单 key ，必填
          }, '|',
          'color', 'bgColor', '|',
          {
            key: 'group-justify', // 必填，要以 group 开头
            title: '对齐方式', // 必填
            iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z"></path></svg>', // 可选
            menuKeys: ['justifyLeft', 'justifyRight', 'justifyCenter', 'justifyJustify'] // 下级菜单 key ，必填
          },
          'bulletedList', 'numberedList',
          {
            key: 'group-indent', // 必填，要以 group 开头
            title: '缩进', // 必填
            iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z"></path></svg>', // 可选
            menuKeys: ['indent', 'delIndent'] // 下级菜单 key ，必填
          },
          'lineHeight', '|', 'todo', 'emotion', 'insertLink', 'blockquote', 'divider',
          'codeBlock',
          {
            key: 'group-insert-more', // 必填，要以 group 开头
            title: '插入', // 必填
            menuKeys: ['insertTable'] // 下级菜单 key ，必填
          }
        ]
        // excludeKeys: [ /* 隐藏哪些菜单 */ ],
      },
      editorConfig: {
        placeholder: '请输入内容...',
        scroll: true
        // 所有的菜单配置，都要在 MENU_CONF 属性下
        /**
         MENU_CONF: {
          uploadImage: {
            fieldName: 'your-fileName',
            base64LimitSize: 10 * 1024 * 1024 // 10M 以下插入 base64
          }
        }**/
      },
      /**
      data: [{
        label: '一级 1',
        children: [{
          label: '二级 1-1',
          test: true,
          children: [{
            label: '三级 1-1-1'
          }]
        }, {
          label: '二级 1-1',
          children: [{
            label: '三级 1-1-1'
          }]
        }]
      }, {
        label: '一级 2',
        children: [{
          label: '二级 2-1',
          children: [{
            label: '三级 2-1-1'
          }]
        }, {
          label: '二级 2-2',
          children: [{
            label: '三级 2-2-1'
          }]
        }]
      }, {
        label: '一级 3',
        children: [{
          label: '二级 3-1',
          children: [{
            label: '三级 3-1-1'
          }]
        }, {
          label: '二级 3-2',
          children: [{
            label: '三级 3-2-1'
          }]
        }]
      }],
      defaultProps: {
        children: 'children',
        label: 'label',
        test: 'test'
      }**/
    }
  },
  methods: {
    /**
     * 自动保存方法
     */
    saveTmpArticleIfNecessary() {
      /**
      const nowTime = new Date().getTime() / 1000
      if (this.lastChangeTime === null) {
        this.lastChangeTime = nowTime
      }
      if ((nowTime - this.lastChangeTime) >= this.autoSaveInterval) {
        tmpSaveArticle(this.postForm).then(response => {
          this.postForm.id = response.data
          this.lastChangeTime = nowTime
        }).catch(err => {
          console.log(err)
        })
      }**/
    },
    initSystemSetting() {
      fetchSystemSetting().then(response => {
        this.autoSaveInterval = response.data.autoSaveArticleTimeIntervalSeconds
      }).catch(err => {
        console.log(err)
      })
      this.lastChangeTime = new Date().getTime() / 1000
    },
    fetchData(id) {
      fetchArticle(id).then(response => {
        this.postForm = response.data
        // set tagsview title
        this.setTagsViewTitle()
        // set page title
        this.setPageTitle()
      }).catch(err => {
        console.log(err)
      })
    },
    updateArticle() {
      /**
      const editor = this.$refs.tencentEditor.editor
      if (editor === null) {
        return
      }
      this.$message({
        message: '内容发布成功',
        type: 'success'
      })
      console.log('html:' + editor.getHtml())
      this.$router.push({ path: '/' })**/
      this.loading = true
      saveArticle(this.postForm).then(response => {
        this.$notify({
          title: '成功',
          message: '保存文章成功',
          type: 'success',
          duration: 2000
        })
        this.postForm.status = 'published'
        this.loading = false
        this.$store.dispatch('tagsView/delView', this.$route)
        this.$router.go(-1)
      }).catch(err => {
        this.loading = false
        console.log(err)
      })
    },
    onCreated(editor) {
      this.editor = Object.seal(editor) // 【注意】一定要用 Object.seal() 否则会报错
      if (this.isEdit) {
        const id = this.$route.params && this.$route.params.id
        this.fetchData(id)
      }
      this.initSystemSetting()
    },
    onChange(editor) {
      const demoObj = document.getElementById('editor-text-area')
      if (this.lastHeight !== null) {
        const heightDiff = demoObj.offsetHeight - this.lastHeight
        if (heightDiff > 0) {
          window.scrollTo(0, document.documentElement.scrollTop + heightDiff)
        }
      }
      this.lastHeight = demoObj.offsetHeight
      // alert(document.documentElement.scrollTop)
      // alert(document.documentElement.clientHeight)
      // window.scrollTo(0, document.documentElement.scrollHeight)
      console.log('onChange', editor.getHtml()) // onChange 时获取编辑器最新内容

      this.renderMenu(editor)
      this.saveTmpArticleIfNecessary()
    },
    renderMenu(editor) {
      const hs = editor.getElemsByTypePrefix('header')
      for (let i = 0; i < hs.length; i++) {
        console.log(hs[i].type + '_' + hs[i].children[0].text)
      }
      this.$refs.tree.filter('')
    },
    filterNode(value, data) {
      return data.test !== true
    }
    /**
    buildMenu(headers, nowType, cur) {

    },**/
  },
  mounted() {
    document.getElementById('editor-text-area').addEventListener('click', e => {
      if (e.target.id === 'editor-text-area') {
        this.editor.focus(true) // focus 到末尾
      }
    })
  },
  beforeDestroy() {
    // 页面销毁前，再提交1次
    this.saveTmpArticleIfNecessary()
    const editor = this.editor
    if (editor == null) return
    editor.destroy() // 组件销毁时，及时销毁 editor ，重要！！！
  }
}
</script>
<style src="@wangeditor/editor/dist/css/style.css"></style>

<style>
#top-container {
  border-bottom: 1px solid #e8e8e8;
  padding-left: 30px;
}

#editor-toolbar {
  background-color: #FCFCFC;
  margin: 0 auto;
}

#content {
  height: calc(100% - 40px);
  position: relative;
}

#editor-container {
  width: 850px;
  margin: 30px auto 150px auto;
  background-color: #fff;
  padding: 20px 50px 50px 50px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 10px rgb(0 0 0 /12%);
}

#title-container {
  padding: 20px 0;
  border-bottom: 1px solid #e8e8e8;
}

#title-container input {
  font-size: 30px;
  border: 0;
  outline: none;
  width: 100%;
  line-height: 1;
}

#editor-text-area {
  min-height: 800px;
  margin-top: 20px;
}
</style>
