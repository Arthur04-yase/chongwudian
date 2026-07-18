import prisma from '../lib/prisma.js'

export const boardingRepo = {
  /** 默认笼舍列表 */
  CAGES: ['A01', 'A02', 'A03', 'A04', 'A05', 'B01', 'B02', 'B03', 'B04', 'B05'],

  /** 按状态查询 */
  async findAll(status?: string) {
    const where: any = { isDeleted: false }
    if (status) where.status = status

    return prisma.boarding.findMany({
      where,
      orderBy: { checkInDate: 'desc' },
      include: {
        pet: { select: { id: true, name: true, species: true, avatarUrl: true, breed: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    })
  },

  /** 笼舍看板：哪些笼子在占用 */
  async cageStatus() {
    const activeBoardings = await prisma.boarding.findMany({
      where: { status: 'active', isDeleted: false },
      select: {
        id: true,
        cageNo: true,
        checkInDate: true,
        checkOutDate: true,
        pet: { select: { id: true, name: true, species: true, avatarUrl: true } },
        customer: { select: { name: true } },
      },
    })

    // 构建笼舍状态
    const occupied = new Set(activeBoardings.map((b) => b.cageNo))
    return this.CAGES.map((no) => {
      const boarding = activeBoardings.find((b) => b.cageNo === no)
      return {
        cageNo: no,
        occupied: !!boarding,
        boarding: boarding || null,
      }
    })
  },

  /** 详情 */
  async findById(id: number) {
    return prisma.boarding.findFirst({
      where: { id, isDeleted: false },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            avatarUrl: true,
            weightKg: true,
          },
        },
        customer: { select: { id: true, name: true, phone: true } },
        careLogs: {
          orderBy: { createdAt: 'desc' },
          include: { staff: { select: { id: true, name: true } } },
        },
      },
    })
  },

  /** 入住登记 */
  async create(dto: {
    petId: number
    customerId: number
    cageNo: string
    checkInDate: string
    checkOutDate: string
    dailyRate: number
    deposit: number
    broughtItems?: string
    emergencyContact?: string
    notes?: string
  }) {
    return prisma.boarding.create({
      data: {
        ...dto,
        broughtItems: dto.broughtItems ?? null,
        emergencyContact: dto.emergencyContact ?? null,
        notes: dto.notes ?? null,
        totalAmount: 0, // 退房时计算
        status: 'active',
      },
      include: {
        pet: { select: { id: true, name: true, species: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    })
  },

  /** 退房结算 */
  async checkout(id: number, actualCheckOut: string) {
    const boarding = await prisma.boarding.findUnique({ where: { id } })
    if (!boarding) throw new Error('寄养记录不存在')

    const checkIn = new Date(boarding.checkInDate)
    const checkOut = new Date(actualCheckOut.slice(0, 10))
    const days = Math.max(
      1,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000)) + 1
    )
    const totalAmount = days * boarding.dailyRate

    return prisma.boarding.update({
      where: { id },
      data: {
        actualCheckOut,
        totalAmount,
        status: 'checked_out',
      },
      include: {
        pet: { select: { name: true } },
        customer: { select: { name: true } },
      },
    })
  },

  /** 添加看护日志 */
  async addCareLog(boardingId: number, staffId: number, logType: string, content: string) {
    return prisma.careLog.create({
      data: { boardingId, staffId, logType, content },
      include: { staff: { select: { id: true, name: true } } },
    })
  },

  /** 删除看护日志 */
  async deleteCareLog(id: number) {
    return prisma.careLog.delete({ where: { id } })
  },
}
