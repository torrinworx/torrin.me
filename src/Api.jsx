import axios from 'axios';

const BASE_PATH = '/api';

const api = {
  example: async (param1, param2) => {
    try {
      const response = await axios.get(`${BASE_PATH}/example/${param1}/${param2}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  },
};

export default api;
