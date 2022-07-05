<template>
  <tencent-editor ref="tencentEditor" :is-edit="true" />
</template>

<script>

import TencentEditor from './components/TencentEditor'

export default {
  name: 'EditArticleLayout',
  components: { TencentEditor }
}
</script>

<style>
.el-aside::-webkit-scrollbar {
  display: none;
}

</style>
