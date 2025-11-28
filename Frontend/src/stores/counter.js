import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * Un store de ejemplo para demostrar la funcionalidad básica de Pinia.
 *
 * @exports useCounterStore
 */
export const useCounterStore = defineStore('counter', () => {
  /**
   * El estado del contador.
   * @type {import('vue').Ref<number>}
   */
  const count = ref(0)
  /**
   * Un getter computado que devuelve el doble del valor del contador.
   * @type {import('vue').ComputedRef<number>}
   */
  const doubleCount = computed(() => count.value * 2)
  /**
   * Una acción que incrementa el valor del contador en uno.
   */
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
