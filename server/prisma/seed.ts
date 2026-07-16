import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * 生成预约编号
 * 格式：APT + YYYYMMDD + 4位序号
 * 生产环境建议使用数据库序列或 Redis 自增
 */
function generateAppointmentNo(date: string, seq: number): string {
  const datePart = date.replace(/-/g, '')
  const seqPart = String(seq).padStart(4, '0')
  return `APT${datePart}${seqPart}`
}

async function main() {
  console.log('🌱 开始填充种子数据...')
  console.log('')

  // ══════════════════════════════════════════════════════════
  // 1. 员工
  // ══════════════════════════════════════════════════════════
  const passwordHash = await bcrypt.hash('123456', 10)

  const boss = await prisma.staff.create({
    data: {
      name: '王建国',
      phone: '13800000001',
      password: passwordHash,
      role: 'owner',
    },
  })

  const groomerZhang = await prisma.staff.create({
    data: {
      name: '小张',
      phone: '13800000002',
      password: passwordHash,
      role: 'groomer',
      commissionType: 'fixed',
      commissionValue: 15,
      hiredDate: '2024-03-15',
    },
  })

  const groomerLi = await prisma.staff.create({
    data: {
      name: '小李',
      phone: '13800000003',
      password: passwordHash,
      role: 'groomer',
      commissionType: 'percent',
      commissionValue: 30,
      hiredDate: '2024-06-01',
    },
  })

  const receptionistChen = await prisma.staff.create({
    data: {
      name: '小陈',
      phone: '13800000004',
      password: passwordHash,
      role: 'receptionist',
      hiredDate: '2025-01-10',
    },
  })
  console.log('  ✅ 员工：4人（1 老板 + 2 美容师 + 1 前台）')

  // ══════════════════════════════════════════════════════════
  // 2. 客户（注意：不再设置 isMember，由会员卡自动判定）
  // ══════════════════════════════════════════════════════════
  const c1 = await prisma.customer.create({
    data: {
      name: '张先生',
      phone: '13900001111',
      wechatId: 'zhang_pet',
      address: '阳光花园3-502',
      source: '朋友介绍',
      totalSpent: 4280,
      lastVisitDate: '2026-07-09',
      visitCount: 12,
    },
  })
  const c2 = await prisma.customer.create({
    data: {
      name: '李女士',
      phone: '13900002222',
      wechatId: 'lili_cat',
      address: '翠园新村12-301',
      source: '大众点评',
      totalSpent: 1560,
      lastVisitDate: '2026-07-12',
      visitCount: 5,
    },
  })
  const c3 = await prisma.customer.create({
    data: {
      name: '王小姐',
      phone: '13900003333',
      wechatId: 'wang_mei',
      address: '碧水湾7-1102',
      source: '抖音',
      totalSpent: 890,
      lastVisitDate: '2026-07-02',
      visitCount: 3,
    },
  })
  const c4 = await prisma.customer.create({
    data: {
      name: '赵先生',
      phone: '13900004444',
      wechatId: 'zhao_golden',
      address: '龙湖天街5-801',
      source: '路过',
      totalSpent: 3200,
      lastVisitDate: '2026-07-15',
      visitCount: 9,
    },
  })
  const c5 = await prisma.customer.create({
    data: {
      name: '刘阿姨',
      phone: '13900005555',
      wechatId: 'liu_ayi',
      address: '春江花月8-203',
      source: '朋友介绍',
      totalSpent: 2100,
      lastVisitDate: '2026-06-30',
      visitCount: 7,
    },
  })
  console.log('  ✅ 客户：5人')

  // ══════════════════════════════════════════════════════════
  // 3. 宠物
  // ══════════════════════════════════════════════════════════
  const p1 = await prisma.pet.create({
    data: {
      customerId: c1.id,
      name: '豆豆',
      species: 'dog',
      breed: '金毛寻回犬',
      gender: 'male',
      birthDate: '2021-03-15',
      weightKg: 28.5,
      color: '金黄色',
      vaccineExpiry: '2026-09-15',
    },
  })
  const p2 = await prisma.pet.create({
    data: {
      customerId: c1.id,
      name: '朵朵',
      species: 'dog',
      breed: '泰迪',
      gender: 'female',
      isNeutered: true,
      birthDate: '2024-01-20',
      weightKg: 4.2,
      color: '棕色',
      vaccineExpiry: '2027-01-10',
    },
  })
  const p3 = await prisma.pet.create({
    data: {
      customerId: c2.id,
      name: '球球',
      species: 'dog',
      breed: '泰迪',
      gender: 'male',
      birthDate: '2023-05-10',
      weightKg: 3.8,
      color: '白色',
      vaccineExpiry: '2026-11-20',
    },
  })
  const p4 = await prisma.pet.create({
    data: {
      customerId: c3.id,
      name: '咪咪',
      species: 'cat',
      breed: '英国短毛猫',
      gender: 'female',
      isNeutered: true,
      birthDate: '2022-08-05',
      weightKg: 4.5,
      color: '蓝灰色',
      vaccineExpiry: '2027-03-01',
      isAggressive: true,
    },
  })
  const p5 = await prisma.pet.create({
    data: {
      customerId: c4.id,
      name: '大黄',
      species: 'dog',
      breed: '拉布拉多',
      gender: 'male',
      birthDate: '2022-06-20',
      weightKg: 32.0,
      color: '黄色',
      vaccineExpiry: '2026-08-30',
    },
  })
  const p6 = await prisma.pet.create({
    data: {
      customerId: c4.id,
      name: '阿福',
      species: 'dog',
      breed: '柯基',
      gender: 'male',
      isNeutered: true,
      birthDate: '2023-11-01',
      weightKg: 12.0,
      color: '黄白相间',
      vaccineExpiry: '2027-05-15',
    },
  })
  const p7 = await prisma.pet.create({
    data: {
      customerId: c5.id,
      name: '小黑',
      species: 'cat',
      breed: '中华田园猫',
      gender: 'male',
      isNeutered: true,
      birthDate: '2021-12-10',
      weightKg: 5.2,
      color: '黑色',
      vaccineExpiry: '2026-12-01',
    },
  })
  const p8 = await prisma.pet.create({
    data: {
      customerId: c5.id,
      name: '欢欢',
      species: 'dog',
      breed: '比熊',
      gender: 'female',
      birthDate: '2024-07-08',
      weightKg: 5.5,
      color: '白色',
      vaccineExpiry: '2027-01-20',
    },
  })
  console.log('  ✅ 宠物：8只')

  // ══════════════════════════════════════════════════════════
  // 4. 宠物备注
  // ══════════════════════════════════════════════════════════
  await prisma.petNote.createMany({
    data: [
      {
        petId: p1.id,
        staffId: groomerLi.id,
        category: 'behavior',
        content: '怕吹风机，需调小风，用毛巾多擦几遍',
      },
      {
        petId: p1.id,
        staffId: groomerZhang.id,
        category: 'health',
        content: '右后腿有点跛，修剪时注意别让它站太久',
      },
      {
        petId: p1.id,
        staffId: groomerLi.id,
        category: 'preference',
        content: '喜欢温水洗澡，水温控制在38度左右',
      },
      {
        petId: p4.id,
        staffId: groomerZhang.id,
        category: 'behavior',
        content: '有攻击性，剪指甲需戴防咬手套，最好两人操作',
      },
      {
        petId: p4.id,
        staffId: groomerLi.id,
        category: 'health',
        content: '左耳易发炎，洗护时注意防水，发现红肿及时告知主人',
      },
      {
        petId: p3.id,
        staffId: groomerZhang.id,
        category: 'preference',
        content: '喜欢造型A（圆头），头顶要扎小辫子',
      },
      {
        petId: p5.id,
        staffId: groomerZhang.id,
        category: 'behavior',
        content: '洗澡很乖，不闹不叫，但怕剪指甲',
      },
      {
        petId: p6.id,
        staffId: groomerLi.id,
        category: 'health',
        content: '皮肤偏敏感，建议用低敏浴液',
      },
    ],
  })
  console.log('  ✅ 宠物备注：8条')

  // ══════════════════════════════════════════════════════════
  // 5. 服务项目
  // ══════════════════════════════════════════════════════════
  await prisma.service.createMany({
    data: [
      {
        name: '洗澡（小型犬/猫）',
        category: 'bath',
        price: 80,
        memberPrice: 68,
        durationMinutes: 30,
        commissionAmount: 15,
        description: '适合10kg以下小型犬和猫咪，含基础洗护+吹干',
        sortOrder: 1,
      },
      {
        name: '洗澡（中型犬）',
        category: 'bath',
        price: 120,
        memberPrice: 102,
        durationMinutes: 45,
        commissionAmount: 20,
        description: '适合10-25kg中型犬，含深层清洁+护毛+吹干',
        sortOrder: 2,
      },
      {
        name: '洗澡（大型犬）',
        category: 'bath',
        price: 180,
        memberPrice: 153,
        durationMinutes: 60,
        commissionAmount: 30,
        description: '适合25kg以上大型犬，含深层清洁+护毛+吹干+脚底护理',
        sortOrder: 3,
      },
      {
        name: '基础美容',
        category: 'groom',
        price: 200,
        memberPrice: 170,
        durationMinutes: 60,
        commissionAmount: 40,
        description: '含全身修剪+造型+耳部清洁+指甲修剪',
        sortOrder: 4,
      },
      {
        name: '精修美容',
        category: 'groom',
        price: 350,
        memberPrice: 298,
        durationMinutes: 90,
        commissionAmount: 70,
        description: '含赛级修剪+造型设计+SPA护毛+口腔清洁+足部护理',
        sortOrder: 5,
      },
      {
        name: '药浴',
        category: 'bath',
        price: 200,
        memberPrice: 170,
        durationMinutes: 50,
        commissionAmount: 30,
        description: '含皮肤检查+药用浴液+深层清洁，适合皮肤病宠物',
        sortOrder: 6,
      },
      {
        name: '剪指甲',
        category: 'other',
        price: 30,
        memberPrice: 25,
        durationMinutes: 10,
        commissionAmount: 5,
        description: '单独剪指甲服务',
        sortOrder: 7,
      },
      {
        name: '清耳道',
        category: 'other',
        price: 40,
        memberPrice: 34,
        durationMinutes: 10,
        commissionAmount: 5,
        description: '耳道清洁+检查',
        sortOrder: 8,
      },
      {
        name: '寄养（小型犬/猫）',
        category: 'boarding',
        price: 60,
        memberPrice: 50,
        durationMinutes: 0,
        commissionAmount: 0,
        description: '每日寄养费，含喂食+遛弯+基础护理',
        sortOrder: 9,
      },
      {
        name: '寄养（大型犬）',
        category: 'boarding',
        price: 100,
        memberPrice: 85,
        durationMinutes: 0,
        commissionAmount: 0,
        description: '每日寄养费，含喂食+遛弯+基础护理',
        sortOrder: 10,
      },
    ],
  })
  console.log('  ✅ 服务项目：10个')

  // ══════════════════════════════════════════════════════════
  // 6. 预约记录
  // ══════════════════════════════════════════════════════════
  const today = '2026-07-16'

  const appt1 = await prisma.appointment.create({
    data: {
      appointmentNo: generateAppointmentNo(today, 1),
      customerId: c1.id,
      petId: p1.id,
      staffId: groomerZhang.id,
      appointmentDate: today,
      startTime: '09:00',
      endTime: '10:00',
      status: 'in_progress',
      source: 'phone',
      notes: '洗完帮忙剪一下脚底的毛',
      createdBy: receptionistChen.id,
    },
  })
  await prisma.appointmentItem.create({
    data: {
      appointmentId: appt1.id,
      serviceId: 3,
      price: 180,
      commissionAmount: 30,
      status: 'in_progress',
    },
  })

  const appt2 = await prisma.appointment.create({
    data: {
      appointmentNo: generateAppointmentNo(today, 2),
      customerId: c2.id,
      petId: p3.id,
      staffId: groomerLi.id,
      appointmentDate: today,
      startTime: '10:00',
      endTime: '11:30',
      status: 'arrived',
      source: 'wechat',
      createdBy: receptionistChen.id,
    },
  })
  await prisma.appointmentItem.create({
    data: {
      appointmentId: appt2.id,
      serviceId: 5,
      price: 298,
      commissionAmount: 70,
      status: 'pending',
    },
  })

  const appt3 = await prisma.appointment.create({
    data: {
      appointmentNo: generateAppointmentNo(today, 3),
      customerId: c3.id,
      petId: p4.id,
      staffId: null,
      appointmentDate: today,
      startTime: '11:00',
      endTime: '11:50',
      status: 'pending',
      source: 'phone',
      notes: '主人说咪咪最近耳朵又有点发红',
      createdBy: receptionistChen.id,
    },
  })
  await prisma.appointmentItem.createMany({
    data: [
      {
        appointmentId: appt3.id,
        serviceId: 6,
        price: 200,
        commissionAmount: 30,
        status: 'pending',
      },
      { appointmentId: appt3.id, serviceId: 7, price: 25, commissionAmount: 5, status: 'pending' },
    ],
  })

  const appt4 = await prisma.appointment.create({
    data: {
      appointmentNo: generateAppointmentNo(today, 4),
      customerId: c4.id,
      petId: p6.id,
      staffId: groomerZhang.id,
      appointmentDate: today,
      startTime: '08:30',
      endTime: '09:15',
      status: 'completed',
      source: 'walk_in',
      createdBy: receptionistChen.id,
    },
  })
  await prisma.appointmentItem.create({
    data: {
      appointmentId: appt4.id,
      serviceId: 1,
      price: 80,
      commissionAmount: 15,
      status: 'completed',
    },
  })

  const appt5 = await prisma.appointment.create({
    data: {
      appointmentNo: generateAppointmentNo('2026-07-17', 1),
      customerId: c4.id,
      petId: p5.id,
      staffId: groomerLi.id,
      appointmentDate: '2026-07-17',
      startTime: '09:00',
      endTime: '11:00',
      status: 'pending',
      source: 'phone',
      createdBy: receptionistChen.id,
    },
  })
  await prisma.appointmentItem.createMany({
    data: [
      {
        appointmentId: appt5.id,
        serviceId: 3,
        price: 153,
        commissionAmount: 30,
        status: 'pending',
      },
      {
        appointmentId: appt5.id,
        serviceId: 4,
        price: 170,
        commissionAmount: 40,
        status: 'pending',
      },
    ],
  })

  const appt6 = await prisma.appointment.create({
    data: {
      appointmentNo: generateAppointmentNo('2026-06-18', 1),
      customerId: c1.id,
      petId: p1.id,
      staffId: groomerLi.id,
      appointmentDate: '2026-06-18',
      startTime: '10:00',
      endTime: '11:30',
      status: 'picked_up',
      source: 'phone',
      createdBy: receptionistChen.id,
    },
  })
  await prisma.appointmentItem.createMany({
    data: [
      {
        appointmentId: appt6.id,
        serviceId: 3,
        price: 153,
        commissionAmount: 30,
        status: 'completed',
      },
      {
        appointmentId: appt6.id,
        serviceId: 4,
        price: 170,
        commissionAmount: 40,
        status: 'completed',
      },
    ],
  })
  await prisma.payment.create({
    data: {
      appointmentId: appt6.id,
      amount: 323,
      method: 'wechat',
      paidAt: new Date('2026-06-18T03:45:00Z'),
      createdBy: receptionistChen.id,
    },
  })

  // appt4 的付款
  await prisma.payment.create({
    data: {
      appointmentId: appt4.id,
      amount: 80,
      method: 'cash',
      paidAt: new Date('2026-07-16T01:20:00Z'),
      createdBy: receptionistChen.id,
    },
  })
  console.log('  ✅ 预约：6条 + 支付：2条')

  // ══════════════════════════════════════════════════════════
  // 7. 寄养
  // ══════════════════════════════════════════════════════════
  const b1 = await prisma.boarding.create({
    data: {
      petId: p7.id,
      customerId: c5.id,
      cageNo: 'A03',
      checkInDate: '2026-07-14',
      checkOutDate: '2026-07-18',
      dailyRate: 60,
      totalAmount: 240,
      deposit: 200,
      status: 'active',
      broughtItems: '皇家猫粮×1袋、猫砂盆×1、逗猫棒×1、小毯子×1',
      emergencyContact: '13900006666',
      notes: '每天早晚各喂一次。小黑比较胆小，前三天可能会躲起来。',
    },
  })
  const b2 = await prisma.boarding.create({
    data: {
      petId: p8.id,
      customerId: c5.id,
      cageNo: 'B01',
      checkInDate: '2026-07-15',
      checkOutDate: '2026-07-19',
      dailyRate: 60,
      totalAmount: 240,
      deposit: 200,
      status: 'active',
      broughtItems: '狗粮×1袋（比瑞吉）、饭盆×1、玩具球×2',
      emergencyContact: '13900006666',
      notes: '欢欢精力旺盛，每天至少遛两次，每次20分钟以上。',
    },
  })
  await prisma.careLog.createMany({
    data: [
      {
        boardingId: b1.id,
        staffId: groomerZhang.id,
        logType: 'feeding',
        content: '早上8:30喂食，吃了大半碗',
        createdAt: new Date('2026-07-15T00:30:00Z'),
      },
      {
        boardingId: b1.id,
        staffId: receptionistChen.id,
        logType: 'cleaning',
        content: '清理猫砂盆，小便正常',
        createdAt: new Date('2026-07-15T02:00:00Z'),
      },
      {
        boardingId: b1.id,
        staffId: groomerZhang.id,
        logType: 'feeding',
        content: '晚上18:00喂食，全部吃完，精神状态好转',
        createdAt: new Date('2026-07-15T10:00:00Z'),
      },
      {
        boardingId: b1.id,
        staffId: receptionistChen.id,
        logType: 'other',
        content: '小黑今天主动出来蹭人了！进步很大',
        createdAt: new Date('2026-07-16T00:00:00Z'),
      },
      {
        boardingId: b2.id,
        staffId: groomerLi.id,
        logType: 'walking',
        content: '下午遛弯25分钟，在草坪上玩得很开心',
        createdAt: new Date('2026-07-15T08:00:00Z'),
      },
      {
        boardingId: b2.id,
        staffId: groomerZhang.id,
        logType: 'feeding',
        content: '早上喂食，全部光盘',
        createdAt: new Date('2026-07-16T00:00:00Z'),
      },
    ],
  })
  console.log('  ✅ 寄养：2条 + 看护日志：6条')

  // ══════════════════════════════════════════════════════════
  // 8. 会员卡（会员身份通过此表判定，不再依赖 Customer.isMember）
  // ══════════════════════════════════════════════════════════
  await prisma.membershipCard.createMany({
    data: [
      {
        customerId: c1.id,
        cardType: 'balance',
        cardNo: 'C2025-00038',
        balance: 560,
        discountRate: 0.85,
        issuedDate: '2025-06-01',
      },
      {
        customerId: c1.id,
        cardType: 'times',
        cardNo: 'T2025-00102',
        totalTimes: 10,
        usedTimes: 6,
        issuedDate: '2025-04-15',
        expiryDate: '2026-10-15',
      },
      {
        customerId: c4.id,
        cardType: 'balance',
        cardNo: 'C2026-00015',
        balance: 1200,
        discountRate: 0.85,
        issuedDate: '2026-01-10',
      },
    ],
  })
  console.log('  ✅ 会员卡：3张')

  // ══════════════════════════════════════════════════════════
  // 9. 库存
  // ══════════════════════════════════════════════════════════
  await prisma.product.createMany({
    data: [
      {
        name: '宠物专用浴液（温和型）',
        category: 'consumable',
        unit: '瓶',
        currentStock: 8,
        safetyStock: 3,
        costPrice: 45,
        retailPrice: 89,
      },
      {
        name: '宠物专用浴液（低敏型）',
        category: 'consumable',
        unit: '瓶',
        currentStock: 2,
        safetyStock: 3,
        costPrice: 58,
        retailPrice: 118,
      },
      {
        name: '护毛素',
        category: 'consumable',
        unit: '瓶',
        currentStock: 5,
        safetyStock: 2,
        costPrice: 35,
        retailPrice: 68,
      },
      {
        name: '宠物毛巾（大号）',
        category: 'consumable',
        unit: '条',
        currentStock: 20,
        safetyStock: 5,
        costPrice: 15,
        retailPrice: 30,
      },
      {
        name: '宠物零食（鸡肉干）',
        category: 'retail',
        unit: '袋',
        currentStock: 15,
        safetyStock: 5,
        costPrice: 12,
        retailPrice: 28,
      },
      {
        name: '皇家猫粮（2kg）',
        category: 'retail',
        unit: '袋',
        currentStock: 4,
        safetyStock: 3,
        costPrice: 85,
        retailPrice: 168,
      },
    ],
  })
  console.log('  ✅ 商品：6种')

  // ══════════════════════════════════════════════════════════
  // 10. 排班
  // ══════════════════════════════════════════════════════════
  await prisma.schedule.createMany({
    data: [
      {
        staffId: groomerZhang.id,
        date: '2026-07-16',
        startTime: '08:30',
        endTime: '18:00',
        maxAppointments: 8,
      },
      {
        staffId: groomerLi.id,
        date: '2026-07-16',
        startTime: '09:00',
        endTime: '18:00',
        maxAppointments: 8,
      },
      {
        staffId: receptionistChen.id,
        date: '2026-07-16',
        startTime: '08:00',
        endTime: '20:00',
        maxAppointments: 20,
      },
      {
        staffId: groomerZhang.id,
        date: '2026-07-17',
        startTime: '08:30',
        endTime: '18:00',
        maxAppointments: 8,
      },
      {
        staffId: groomerLi.id,
        date: '2026-07-17',
        startTime: '09:00',
        endTime: '18:00',
        maxAppointments: 8,
      },
    ],
  })
  console.log('  ✅ 排班：5条')

  console.log('')
  console.log('🎉 种子数据填充完成！')
  console.log('')
  console.log('📋 演示登录账号（密码均为 123456）：')
  console.log('   老板 王建国：13800000001')
  console.log('   美容师 小张：13800000002')
  console.log('   美容师 小李：13800000003')
  console.log('   前台 小陈：  13800000004')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
