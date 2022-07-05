import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/admin/login',
    method: 'post',
    data
  })
}

export function getInfo(token) {
  return request({
    url: '/admin/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/admin/logout',
    method: 'post'
  })
}

export function fetchSystemSetting() {
  return request({
    url: '/admin/system-setting',
    method: 'get'
  })
}

export function updateSystemSetting(data) {
  return request({
    url: '/admin/update-system-setting',
    method: 'post',
    data
  })
}
