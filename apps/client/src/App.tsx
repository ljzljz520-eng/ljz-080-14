import { Navigate, Route, Routes } from 'react-router-dom';
import { HashRouter } from 'react-router-dom';
import PcApp from './pc/PcApp';
import H5App from './h5/H5App';

/**
 * 单应用双入口（开发环境统一预览）：
 *  #/pc/*    管家管理端（PC，antd）
 *  #/h5/*    移动门户（护工端 / 家属端，antd-mobile）
 * 构建产物分别输出 pc.html / h5.html（见 vite.config.ts）。
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/pc/*" element={<PcApp />} />
        <Route path="/h5/*" element={<H5App />} />
        <Route path="*" element={<Navigate to="/pc/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}
