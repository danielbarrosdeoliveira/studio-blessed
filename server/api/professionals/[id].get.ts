import { getProfessionalOr404, requireProfessionalAccess } from '../../utils/professionals'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Profissional não informada' })
  }

  await requireProfessionalAccess(event, id)

  return getProfessionalOr404(id)
})
