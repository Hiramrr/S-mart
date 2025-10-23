<script setup>
import { ref } from 'vue'
import ProductCard from './ProductCard.vue'

const totalProducts = ref(1000)

// Datos de ejemplo para las tarjetas
const products = ref([
    { id: 1, name: 'Nombre del producto', rating: 4.5, price: 'PRECIO', description: 'Descripción de forma de pago' },
    { id: 2, name: 'Nombre del producto', rating: 4.5, price: 'PRECIO', description: 'Descripción de forma de pago' },
    { id: 3, name: 'Nombre del producto', rating: 4.5, price: 'PRECIO', description: 'Descripción de forma de pago' },
    { id: 4, name: 'Nombre del producto', rating: 4.5, price: 'PRECIO', description: 'Descripción de forma de pago' },
    { id: 5, name: 'Nombre del producto', rating: 4.5, price: 'PRECIO', description: 'Descripción de forma de pago' },
    { id: 6, name: 'Nombre del producto', rating: 4.5, price: 'PRECIO', description: 'Descripción de forma de pago' },
    { id: 7, name: 'Nombre del producto', rating: 4.5, price: 'PRECIO', description: 'Descripción de forma de pago' },
    { id: 8, name: 'Nombre del producto', rating: 4.5, price: 'PRECIO', description: 'Descripción de forma de pago' },
])
</script>

<template>
    <div class="product-section">
        <!-- Sidebar de Filtros -->
        <aside class="sidebar">
            <h2 class="sidebar-title">Filtro</h2>
            <!-- Aquí puedes agregar tus filtros más adelante -->
            <div class="filter-placeholder">
                <p>Categorías</p>
                <p>Precio</p>
                <p>Marca</p>
            </div>
        </aside>

        <!-- Área de Productos -->
        <main class="products-area">
            <!-- Contador de Productos -->
            <div class="products-header">
                <h1 class="products-count">+{{ totalProducts }} Productos encontrados</h1>
            </div>

            <!-- Grid de Productos -->
            <div class="products-grid">
                <ProductCard 
                    v-for="product in products" 
                    :key="product.id"
                    :product-name="product.name"
                    :rating="product.rating"
                    :price="product.price"
                    :description="product.description"
                />
            </div>
        </main>
    </div>
</template>

<style scoped>
.product-section {
    display: flex;
    min-height: calc(100vh - 61px);
    background-color: #f9fafb;
}

/* Sidebar */
.sidebar {
    width: 250px;
    background-color: #ffffff;
    border-right: 1px solid #e5e7eb;
    padding: 1.5rem;
    position: sticky;
    top: 61px;
    height: fit-content;
}

.sidebar-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: #111827;
}

.filter-placeholder {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.filter-placeholder p {
    color: #6b7280;
    font-size: 0.875rem;
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
}

/* Products Area */
.products-area {
    flex: 1;
    padding: 1.5rem;
}

.products-header {
    margin-bottom: 1.5rem;
}

.products-count {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
}

/* Products Grid */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
    .sidebar {
        display: none;
    }
    
    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }
}
</style>