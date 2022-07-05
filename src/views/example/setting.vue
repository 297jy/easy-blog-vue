<template>
  <setting-detail :is-edit="false" />
</template>

<script>
import SettingDetail from './components/SettingDetail'

export default {
  name: 'SystemSetting',
  components: { SettingDetail }
}
</script>

