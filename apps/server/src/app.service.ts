import { Injectable } from '@nestjs/common';
import { today } from './common/util.js';

@Injectable()
export class AppService {
  health() {
    return {
      service: '社区养老协作平台 - 慢病药盒管理',
      status: 'ok',
      demoDate: today(),
    };
  }
}
