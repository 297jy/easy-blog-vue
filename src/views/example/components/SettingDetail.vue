<template>
  <div class="createPost-container">
    <el-form ref="postForm" :model="postForm" class="form-container">

      <div class="createPost-main-container">
        <el-row>
          <el-col :span="24">
            <div class="postInfo-container">
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="头像:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.avatar" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="用户名:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.username" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="密码:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.password" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="网站介绍:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.introduction" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="加密私钥:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.authSecret" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="令牌存放路径:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.tokenPath" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="文章存放路径:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.hexoSourcePath" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="文章暂存路径:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.hexoTmpSourcePath" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="文章废弃路径:" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.hexoRemoveSourcePath" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="登录过期时间(秒):" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.tokenExpireSeconds" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label-width="180px" label="文章自动保存时间间隔(秒):" class="postInfo-container-item" style="width: 100%">
                    <el-input v-model="postForm.autoSaveArticleTimeIntervalSeconds" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-button v-loading="loading" style="margin-left: 10px;" type="success" @click="submitForm">
                    提交
                  </el-button>
                </el-col>
              </el-row>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<script>
import { validURL } from '@/utils/validate'
import { fetchSystemSetting, updateSystemSetting } from '@/api/user'

import { searchUser } from '@/api/remote-search'

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
  name: 'SettingDetail',
  components: { },
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
      tempRoute: {}
    }
  },
  computed: {
    contentShortLength() {
      return this.postForm.content_short.length
    }
  },
  created() {
    this.fetchData()
    // Why need to make a copy of this.$route here?
    // Because if you enter this page and quickly switch tag, may be in the execution of the setTagsViewTitle function, this.$route is no longer pointing to the current page
    // https://github.com/PanJiaChen/vue-element-admin/issues/1221
    this.tempRoute = Object.assign({}, this.$route)
  },
  methods: {
    fetchData() {
      fetchSystemSetting().then(response => {
        this.postForm = response.data
      }).catch(err => {
        console.log(err)
      })
    },
    submitForm() {
      this.loading = true
      updateSystemSetting(this.postForm).then(response => {
        this.$notify({
          title: '成功',
          message: '修改设置成功',
          type: 'success',
          duration: 2000
        })
        this.loading = false
      }).catch(err => {
        this.loading = false
        console.log(err)
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
