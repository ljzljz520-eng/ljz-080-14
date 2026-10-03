import {
  Caregiver,
  Elder,
  HealthObservation,
  Manager,
  MedCheck,
  Medication,
} from './types.js';

/**
 * 演示数据（结构对应 Supabase 表）。
 * 今天固定取 2026-10-03，便于复现提醒场景。
 */
const TODAY = '2026-10-03';

export const managers: Manager[] = [{ id: 'm1', name: '王管家' }];

export const caregivers: Caregiver[] = [
  { id: 'c1', name: '李护工', phone: '13800000001' },
  { id: 'c2', name: '赵护工', phone: '13800000002' },
];

export const elders: Elder[] = [
  {
    id: 'e1',
    name: '张桂兰',
    age: 78,
    gender: 'female',
    address: '幸福里社区 3 栋 202',
    roomNo: '3-202',
    managerId: 'm1',
    caregiverIds: ['c1'],
    primaryFamilyId: 'f1',
    family: [
      { id: 'f1', name: '周建国', relation: '儿子', phone: '13900000001' },
      { id: 'f2', name: '周小梅', relation: '女儿', phone: '13900000002' },
    ],
  },
  {
    id: 'e2',
    name: '刘长福',
    age: 82,
    gender: 'male',
    address: '幸福里社区 7 栋 501',
    roomNo: '7-501',
    managerId: 'm1',
    caregiverIds: ['c2'],
    primaryFamilyId: 'f3',
    family: [
      { id: 'f3', name: '刘敏', relation: '孙女', phone: '13900000003' },
    ],
  },
  {
    id: 'e3',
    name: '陈淑芬',
    age: 75,
    gender: 'female',
    address: '幸福里社区 1 栋 103',
    roomNo: '1-103',
    managerId: 'm1',
    caregiverIds: ['c1'],
    primaryFamilyId: 'f4',
    family: [
      { id: 'f4', name: '孙伟', relation: '女婿', phone: '13900000004' },
    ],
  },
] as Elder[];

export const medications: Medication[] = [
  {
    id: 'md1',
    elderId: 'e1',
    name: '苯磺酸氨氯地平片',
    category: 'hypertension',
    dosageText: '5mg/片',
    scheduleText: '每日1次（早餐后）',
    dosesPerDay: 1,
    stockDoses: 5,
    thresholdDays: 7,
    nextVisitDate: '2026-10-10',
    // 5 / 1 = 5 天余量，10-05 断药，复诊 10-10 -> 低余量 + 复诊前备药
    buyerChannel: 'family',
    buyerName: '周建国（儿子）',
    buyerLeadDays: 3,
    buyerNote: '习惯在社区医院便民门诊开28天量',
    status: 'active',
    createdAt: '2026-08-01T09:00:00+08:00',
  },
  {
    id: 'md2',
    elderId: 'e1',
    name: '二甲双胍缓释片',
    category: 'diabetes',
    dosageText: '0.5g/片',
    scheduleText: '每日2次（早晚餐后）',
    dosesPerDay: 2,
    stockDoses: 20,
    thresholdDays: 7,
    nextVisitDate: '2026-10-10',
    // 20 / 2 = 10 天 -> 正常
    buyerChannel: 'family',
    buyerName: '周建国（儿子）',
    buyerLeadDays: 3,
    buyerNote: '线上药店常有满减，会凑单多买一盒',
    status: 'active',
    createdAt: '2026-08-01T09:00:00+08:00',
  },
  {
    id: 'md3',
    elderId: 'e2',
    name: '硝苯地平控释片',
    category: 'hypertension',
    dosageText: '30mg/片',
    scheduleText: '每日1次',
    dosesPerDay: 1,
    stockDoses: 2,
    thresholdDays: 7,
    nextVisitDate: '2026-10-06',
    // 余量仅2天 + 3天后复诊 + 习惯提前2天 -> 紧急补药
    buyerChannel: 'online',
    buyerName: '刘敏（孙女）',
    buyerLeadDays: 2,
    buyerNote: '线上下单配送到家，通常次日达',
    status: 'active',
    createdAt: '2026-07-15T09:00:00+08:00',
  },
  {
    id: 'md4',
    elderId: 'e2',
    name: '格列美脲片',
    category: 'diabetes',
    dosageText: '2mg/片',
    scheduleText: '每日1次（早餐前）',
    dosesPerDay: 1,
    stockDoses: 40,
    thresholdDays: 7,
    nextVisitDate: '2026-10-20',
    buyerChannel: 'pharmacy',
    buyerName: '刘长福本人到店',
    buyerLeadDays: 1,
    buyerNote: '楼下国大药房自购，护工陪同',
    status: 'active',
    createdAt: '2026-07-15T09:00:00+08:00',
  },
  {
    id: 'md5',
    elderId: 'e3',
    name: '缬沙坦胶囊',
    category: 'hypertension',
    dosageText: '80mg/粒',
    scheduleText: '每日1次',
    dosesPerDay: 1,
    stockDoses: 90,
    thresholdDays: 7,
    nextVisitDate: '2026-11-15',
    buyerChannel: 'family',
    buyerName: '孙伟（女婿）',
    buyerLeadDays: 5,
    buyerNote: '上次医院开了3个月量',
    status: 'active',
    createdAt: '2026-09-01T09:00:00+08:00',
  },
] as Medication[];

export const medChecks: MedCheck[] = [];
export const observations: HealthObservation[] = [];

export const DEMO_TODAY = TODAY;
