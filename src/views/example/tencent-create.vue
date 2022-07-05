<template>
  <tencent-editor ref="tencentEditor" :is-edit="false"/>
</template>

<script>

import TencentEditor from './components/TencentEditor'

export default {
  name: 'CreateArticleLayout',
  components: { TencentEditor }
}
</script>

<style>
.el-aside::-webkit-scrollbar {
  display: none;
}

</style>
