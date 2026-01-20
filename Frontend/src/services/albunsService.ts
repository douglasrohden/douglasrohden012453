import axios from '../config/axiosConfig'

export const getAlbuns = () => {
  return axios.get('/albuns').then(response => response.data)
} 