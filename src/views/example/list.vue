<template>
  <div class="app-container">
    <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
      <el-table-column align="center" label="序号" width="80">
        <template slot-scope="scope">
          <span>{{ scope.row.no }}</span>
        </template>
      </el-table-column>

      <el-table-column min-width="300px" label="标题">
        <template slot-scope="{row}">
          <router-link :to="'/edit/'+row.id" class="link-type">
            <span>{{ row.title }}</span>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column min-width="200px" label="类型">
        <template slot-scope="{row}">
          <template v-if="row.edit">
            <el-input v-model="row.categories" class="edit-input"/>
          </template>
          <span v-else>{{ row.categories }}</span>
        </template>
      </el-table-column>
      <el-table-column min-width="200px" label="标签">
        <template slot-scope="{row}">
          <template v-if="row.edit">
            <el-input v-model="row.tags" class="edit-input"/>
          </template>
          <span v-else>{{ row.tags }}</span>
        </template>
      </el-table-column>
      <el-table-column min-width="200px" label="封面图片">
        <template slot-scope="{row}">
          <template v-if="row.edit">
            <el-input v-model="row.cover" class="edit-input"/>
          </template>
          <span v-else>{{ row.cover }}</span>
        </template>
      </el-table-column>
      <el-table-column width="180px" align="center" label="发布日期">
        <template slot-scope="scope">
          <span>{{ scope.row.publishFormatTime }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="180">
        <!--
        <template slot-scope="scope">
          <router-link :to="'/edit/'+scope.row.id">
            <el-button type="primary" size="small" icon="el-icon-edit">
              编辑
            </el-button>
          </router-link>
          <el-button type="danger" size="small" icon="el-icon-delete" style="margin-left: 10px" @click="submitForm(scope.row.id)">
            删除
          </el-button>
        </template>
        -->
        <template slot-scope="{row}">
          <template v-if="row.edit">
            <el-button
              type="success"
              size="small"
              @click="confirmEdit(row)"
            >
              Ok
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="cancelEdit(row)"
            >
              cancel
            </el-button>
          </template>
          <el-button
            v-else
            type="primary"
            size="small"
            icon="el-icon-edit"
            @click="row.edit=!row.edit"
          >
            Edit
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList"/>
  </div>
</template>

<script>
import { createArticle, deleteArticle, fetchList } from '@/api/article'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

export default {
  name: 'ArticleList',
  components: { Pagination },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20
      }
    }
  },
  created() {
    this.getList()
  },
  mounted() {
  },
  activated() {
    this.getList()
  },
  unActivated() {
    alert('yes')
  },
  methods: {
    confirmEdit(row) {
      row.edit = false
      row.originalTags = row.tags
      row.originalCategories = row.categories
      row.originalCover = row.cover
      this.updateArticleInfo(row)
    },
    cancelEdit(row) {
      row.tags = row.originalTags
      row.categories = row.originalCategories
      row.cover = row.originalCover
      row.edit = false
    },
    getList() {
      this.listLoading = true
      fetchList(this.listQuery).then(response => {
        this.list = response.data.items
        this.list = response.data.items.map(v => {
          this.$set(v, 'edit', false)
          v.originalTags = v.tags
          v.originalCategories = v.categories
          v.originalCover = v.cover
          return v
        })
        this.total = response.data.total
        this.listLoading = false
      })
    },
    updateArticleInfo(row) {
      createArticle({
        'id': row.id,
        'tags': row.tags,
        'categories': row.categories,
        'cover': row.cover
      }).then(response => {
        this.postForm.id = response.data
      }).catch(err => {
        console.log(err)
      })
    },
    submitForm(id) {
      this.loading = true
      alert(id)
      deleteArticle(id).then(response => {
        this.loading = false
        this.$notify({
          title: '删除',
          message: '删除文章成功',
          type: 'success',
          duration: 2000
        })
        this.getList()
      }).catch(err => {
        this.loading = false
        this.$notify({
          title: '删除',
          message: '删除文章失败',
          type: 'error',
          duration: 2000
        })
        console.log(err)
      })
    }
  }
}
</script>

<style scoped>
.edit-input {
  padding-right: 100px;
}

.cancel-btn {
  position: absolute;
  right: 15px;
  top: 10px;
}
</style>
