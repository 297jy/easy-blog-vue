<template>
  <div class="createPost-container">
    <el-form ref="postForm" :model="postForm" class="form-container">

      <sticky :z-index="10" :class-name="'sub-navbar '+postForm.status">
        <el-button v-loading="loading" style="margin-left: 10px;" type="success" @click="submitForm">
          发布
        </el-button>
        <el-button v-loading="loading" type="warning" @click="draftForm">
          草稿
        </el-button>
      </sticky>

      <div class="createPost-main-container">
        <el-row>
          <el-col :span="24">
            <el-form-item style="margin-bottom: 40px;" prop="title">
              <MDinput v-model="postForm.title" :maxlength="100" name="name" required>
                标题
              </MDinput>
            </el-form-item>

            <div class="postInfo-container">
              <el-row>
                <el-col :span="8">
                  <el-form-item label-width="60px" label="作者:" class="postInfo-container-item">
                    <el-input v-model="postForm.author" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label-width="60px" label="类型:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.categories" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="8">
                  <el-form-item label-width="60px" label="时间:" class="postInfo-container-item">
                    <el-date-picker v-model="displayTime" type="datetime" format="yyyy-MM-dd HH:mm:ss" placeholder="请选择一个时间" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label-width="60px" label="标签:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.tags" />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-col>
        </el-row>

        <el-form-item style="margin-bottom: 40px;" label-width="100px" label="关键词:">
          <el-input v-model="postForm.keyWords" :rows="1" type="textarea" class="article-textarea" autosize placeholder="请输入文章关键词" />
          <span v-show="contentShortLength" class="word-counter">{{ contentShortLength }}words</span>
        </el-form-item>

        <el-form-item style="margin-bottom: 40px;" label-width="100px" label="封面图片url:">
          <el-input v-model="postForm.cover" :rows="1" type="textarea" class="article-textarea" autosize placeholder="请输入封面图片url" />
          <span v-show="contentShortLength" class="word-counter">{{ contentShortLength }}words</span>
        </el-form-item>

        <el-form-item prop="content" style="margin-bottom: 30px;">
          <div style="border: 1px solid #ccc;">
            <Toolbar
              style="border-bottom: 1px solid #ccc"
              :editor="editor"
              :default-config="toolbarConfig"
              :mode="mode"
            />
            <Editor
              v-model="postForm.content"
              style="height: 700px; overflow-y: hidden;"
              :default-config="editorConfig"
              :mode="mode"
              @onCreated="onCreated"
            />
          </div>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script>
import MDinput from '@/components/MDinput'
import Sticky from '@/components/Sticky' // 粘性header组件
import { validURL } from '@/utils/validate'
import { saveArticle, fetchArticle, tmpSaveArticle } from '@/api/article'
import { fetchSystemSetting } from '@/api/user'
import { searchUser } from '@/api/remote-search'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

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
  name: 'ArticleDetail',
  components: { MDinput, Sticky, Editor, Toolbar },
  props: {
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const validateRequire = (rule, value, callback) => {
      if (value === '') {
        this.$message({
          message: rule.field + '为必传项',
          type: 'error'
        })
        callback(new Error(rule.field + '为必传项'))
      } else {
        callback()
      }
    }
    const validateSourceUri = (rule, value, callback) => {
      if (value) {
        if (validURL(value)) {
          callback()
        } else {
          this.$message({
            message: '外链url填写不正确',
            type: 'error'
          })
          callback(new Error('外链url填写不正确'))
        }
      } else {
        callback()
      }
    }
    return {
      postForm: Object.assign({}, defaultForm),
      loading: false,
      userListOptions: [],
      rules: {
        image_uri: [{ validator: validateRequire }],
        title: [{ validator: validateRequire }],
        content: [{ validator: validateRequire }],
        source_uri: [{ validator: validateSourceUri, trigger: 'blur' }]
      },
      tempRoute: {},
      tmpSaveArticleTimer: '',
      editor: null,
      html: '<p>hello</p>',
      toolbarConfig: { },
      editorConfig: {
        placeholder: '请输入内容...',
        MENU_CONF: {
          uploadImage: {
            base64LimitSize: 5 * 1024 * 1024// 5kb
          }
        }
      },
      mode: 'default' // or 'simple'
    }
  },
  computed: {
    contentShortLength() {
      return this.postForm.content_short.length
    },
    displayTime: {
      // set and get is useful when the data
      // returned by the back end api is different from the front end
      // back end return => "2013-06-25 06:59:25"
      // front end need timestamp => 1372114765000
      get() {
        return (+new Date(this.postForm.publishTime))
      },
      set(val) {
        this.postForm.publishTime = new Date(val)
      }
    }
  },
  created() {
    this.fetchSystemSetting()
    if (this.isEdit) {
      const id = this.$route.params && this.$route.params.id
      this.fetchData(id)
    }

    // Why need to make a copy of this.$route here?
    // Because if you enter this page and quickly switch tag, may be in the execution of the setTagsViewTitle function, this.$route is no longer pointing to the current page
    // https://github.com/PanJiaChen/vue-element-admin/issues/1221
    this.tempRoute = Object.assign({}, this.$route)
  },
  beforeDestroy() {
    // clearInterval(this.tmpSaveArticleTimer)
    const editor = this.editor
    if (editor == null) return
    editor.destroy() // 组件销毁时，及时销毁编辑器
  },
  methods: {
    onCreated(editor) {
      this.editor = Object.seal(editor) // 一定要用 Object.seal() ，否则会报错
    },
    fetchData(id) {
      fetchArticle(id).then(response => {
        this.postForm = response.data

        // just for test
        this.postForm.content_short += `   Article Id:${this.postForm.id}`

        // set tagsview title
        this.setTagsViewTitle()

        // set page title
        this.setPageTitle()
      }).catch(err => {
        console.log(err)
      })
    },
    submitTmpArticleForm() {
      tmpSaveArticle(this.postForm).then(response => {
        this.postForm.id = response.data
      }).catch(err => {
        console.log(err)
      })
    },
    fetchSystemSetting() {
      fetchSystemSetting().then(response => {
        // const autoSaveInterval = response.data.autoSaveArticleTimeIntervalMinutes * 60 * 1000
        // this.tmpSaveArticleTimer = setInterval(this.submitTmpArticleForm, autoSaveInterval)
      }).catch(err => {
        console.log(err)
      })
    },
    setTagsViewTitle() {
      const title = '编辑文章'
      const route = Object.assign({}, this.tempRoute, { title: `${title}-${this.postForm.title}` })
      this.$store.dispatch('tagsView/updateVisitedView', route)
    },
    setPageTitle() {
      const title = 'Edit Article'
      document.title = `${title} - ${this.postForm.id}`
    },
    submitForm() {
      console.log(this.postForm)
      this.$refs.postForm.validate(valid => {
        if (valid) {
          this.loading = true
          saveArticle(this.postForm).then(response => {
            this.$notify({
              title: '成功',
              message: '发布文章成功',
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
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    draftForm() {
      if (this.postForm.content.length === 0 || this.postForm.title.length === 0) {
        this.$message({
          message: '请填写必要的标题和内容',
          type: 'warning'
        })
        return
      }
      this.$message({
        message: '保存成功',
        type: 'success',
        showClose: true,
        duration: 1000
      })
      this.postForm.status = 'draft'
    },
    getRemoteUserList(query) {
      searchUser(query).then(response => {
        if (!response.data.items) return
        this.userListOptions = response.data.items.map(v => v.name)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/styles/mixin.scss";

.createPost-container {
  position: relative;

  .createPost-main-container {
    padding: 40px 45px 20px 50px;

    .postInfo-container {
      position: relative;
      @include clearfix;
      margin-bottom: 10px;

      .postInfo-container-item {
        float: left;
      }
    }
  }

  .word-counter {
    width: 40px;
    position: absolute;
    right: 10px;
    top: 0px;
  }
}

.article-textarea ::v-deep {
  textarea {
    padding-right: 40px;
    resize: none;
    border: none;
    border-radius: 0px;
    border-bottom: 1px solid #bfcbd9;
  }
}
</style>
