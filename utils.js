async function asyncPool(iterable, iteratorFn, poolLimit = 20,) {
  const ret = []
  const executing = new Set()
  for (const item of iterable) {
    const p = Promise.resolve().then(() => iteratorFn(item, iterable))
    ret.push(p)
    executing.add(p)
    const clean = () => executing.delete(p)
    p.then(clean).catch(clean)
    if (executing.size >= poolLimit) {
      await Promise.race(executing)
    }
  }
  return Promise.all(ret)
}
module.exports = {
  asyncPool,
}