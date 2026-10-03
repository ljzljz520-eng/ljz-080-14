import { Global, Module } from '@nestjs/common';
import { DataStore } from './data.store';

/** 全局共享数据仓库（单例） */
@Global()
@Module({
  providers: [DataStore],
  exports: [DataStore],
})
export class CommonModule {}
