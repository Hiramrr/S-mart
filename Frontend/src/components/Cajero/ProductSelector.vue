<!-- components/Cajero/ProductSelector.vue -->
<template>
  <div class="product-selector">
    <h3 class="section-title">Lista de productos</h3>
    
    <div class="search-container">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Buscar producto..."
        class="search-input"
      />
    </div>

    <div class="table-container">
      <table class="products-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id">
            <td>{{ product.id }}</td>
            <td>{{ product.name }}</td>
            <td>${{ product.precio.toLocaleString() }}</td>
            <td>{{ product.stock }}</td>
            <td>
              <button 
                @click="$emit('add-product', product)"
                class="btn-add"
              >
                Agregar
              </button>
            </td>
          </tr>
          <tr v-if="filteredProducts.length === 0">
            <td colspan="5" class="no-results">
              No se encontraron productos
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'ProductSelector',
  props: {
    products: {
      type: Array,
      required: true
    }
  },
  emits: ['add-product'],
  setup(props) {
    const searchTerm = ref('');

    const filteredProducts = computed(() => {
      if (!searchTerm.value) return props.products;
      
      return props.products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.value.toLowerCase())
      );
    });

    return {
      searchTerm,
      filteredProducts
    };
  }
};
</script>

<style scoped>
.product-selector {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 1rem;
}

.search-container {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.table-container {
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table thead {
  background-color: #f3f4f6;
}

.products-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #4b5563;
  font-size: 0.95rem;
}

.products-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.products-table tbody tr:hover {
  background-color: #f9fafb;
}

.btn-add {
  background-color: #7c3aed;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-add:hover {
  background-color: #6d28d9;
}

.no-results {
  text-align: center;
  color: #9ca3af;
  padding: 2rem !important;
}
</style>