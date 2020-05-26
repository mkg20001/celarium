'use strict'

module.exports = (server, mongoose) => {
  models.forEach(model => {
    const DBM = mongoose.Model(model.name)

    server.route(`/${model.name}/{id}`, {
      method: 'GET',
      handler: async (h, reply) => {
        const obj = await DBM.find({ _id: h.params.id })
      }
    })
  })
}
