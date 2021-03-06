import fc from "fast-check";
import { Order, Inventory, Product, Customer } from "../model";
import { List, Set, Map } from "immutable";

export function arbitraryProblem(maxOrderSize: number, numProducts={min: 1, max: 10}, numOrders={min: 1, max: 10}): fc.Arbitrary<[Order[], Inventory]> {
  return arbitraryProducts(numProducts.min, numProducts.max).chain(products =>
    fc.tuple(
      fc.array(arbitraryOrder(products, maxOrderSize), {minLength: numOrders.min, maxLength: numOrders.max}),
      arbitraryInventory(products)
    ));
}

function arbitraryProducts(minProducts: number, maxProducts: number): fc.Arbitrary<Product[]> {
  return fc.set(
    fc.tuple(fc.string(), fc.float({min: 0.1}).map(cost => Math.round(cost * 100) / 100))
      .map(([name, cost]) => new Product({name, cost})),
    {minLength: minProducts, maxLength: maxProducts}
  );
}

function arbitraryInventory(products: Product[]): fc.Arbitrary<Inventory> {
  return fc.array(
    fc.integer({min: 1, max: 20}), {minLength: products.length, maxLength: products.length}
    ).map(qs => {
      return new Inventory({
        quantities: Map(List(products).map((product, index) => [product, qs[index]]))
      });
  });
}

function arbitraryOrder(products: Product[], maxOrderSize: number): fc.Arbitrary<Order> {
  return fc.tuple(arbitraryCustomer(products), fc.integer({ min: 1, max: maxOrderSize }))
    .map(([customer, size]) => new Order({customer, size}))
}

function arbitraryCustomer(products: Product[]): fc.Arbitrary<Customer> {
  return fc.tuple(arbitraryPreferences(products), arbitraryAllergies(products), fc.string())
    .map(([preferences, allergies, name]) => new Customer({
      preferences,
      allergies: Set(allergies),
      name
    }));
}

function arbitraryPreferences(products: Product[]): fc.Arbitrary<Map<Product, number>> {
  return fc.array(fc.float({min: 0.1}).map(pref => Math.round(pref * 100) / 100), { minLength: products.length, maxLength: products.length })
           .map(prefs => Map(prefs.map((val, index) => [products[index], val])));
}

function arbitraryAllergies(products: Product[]): fc.Arbitrary<Product[]> {
  return fc.shuffledSubarray(products);
}