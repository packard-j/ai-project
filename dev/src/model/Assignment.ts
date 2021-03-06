/**
 * A map of customers to products.
 * Can be evaluated for the score of the assignment.
 */

import { Record, Map, Set, List, RecordOf } from "immutable";
import { Product } from './Product';
import { Customer } from './Customer';
import _ from "lodash";
import { Order } from './Order';
import { Inventory } from ".";

export class Assignment extends Record({ products: Map<Customer, Set<Product>>() }) {

  numAssigned(): number {
    return this.products.valueSeq().reduce((acc, products) => acc + products.size, 0);
  }

  productsGivenTo(customer: Customer): Set<Product> {
    return this.products.get(customer) ?? Set();
  }

  assignProductToCustomer(customer: Customer, product: Product) {
    // throw error if customer is allergic to product
    if (customer.isAllergicTo(product)) {
      throw new Error(`Customer ${customer.name} is allergic to ${product.name}`);
    }
    // throw error if customer already has product
    if (this.hasProductAssignedToCustomer(customer, product)) {
      throw new Error(`Customer ${customer.name} already has ${product.name}`);
    }
    return new Assignment({
      products: this.products.set(
        customer,
        this.productsGivenTo(customer).add(product)
      )
    });
  }

  hasProductAssignedToCustomer(customer: Customer, product: Product) {
    return this.productsGivenTo(customer).has(product);
  }

  fulfillsOrders(orders: List<Order>): boolean {
    return orders.every(order => this.productsGivenTo(order.customer).size === order.size);
  }

  calculateCost(): number {
    return _.sum(
      this.products.valueSeq().toArray().map(
        products => _.sum(products.toArray().map(product => product.cost))
      )
    )
  }

  calculateSatisfaction(): number {
    return this.products.keySeq().reduce((sum, customer) => sum + this.calculateCustomerSatisfaction(customer), 0)
  }

  calculateCustomerSatisfaction(customer: Customer): number {
    return this.productsGivenTo(customer).reduce(
      (sum, product) => sum + customer.preferenceFor(product),
      0
    );
  }

  toString() {
    return this.products.keySeq()
      .map(customer => `customer "${customer.name}" -> ${this.productsGivenTo(customer).map(product => `"${product.name}" $${product.cost}`).join(', ')}`)
      .join('\n');
  }

  isValid(orders: List<Order>, inventory: Inventory): boolean {
    return this.respectsAllergies() &&
           this.doesNotExceedOrderSizes(orders) &&
           this.usesAllOrLessThanInventory(inventory);
  }

  respectsAllergies(): boolean {
    return !this.products.entrySeq().some(([customer, products]) => customer.isAllergicToAny(products));
  }

  doesNotExceedOrderSizes(orders: List<Order>): boolean {
    return this.products.entrySeq().every(([customer, products]) => {
      const customerOrder = orders.find(order => order.customer.equals(customer));
      // there cannot be an assignment to a customer that did not order anything
      if (customerOrder === undefined) {
        // console.warn("assigned to customer that did not order anything");
        return false;
      };
      if (products.size > customerOrder.size) {
        // console.warn("assigned more products than customer ordered");
        return false;
      }
      return true;
    });
  }

  usesAllOrLessThanInventory(inventory: Inventory): boolean {
    return inventory.products()
      .every(product => this.countProductAssignments(product) <= inventory.quantityOf(product))
  }

  countProductAssignments(product: Product): number {
    return this.products.keySeq().reduce(
      (total, customer) => this.hasProductAssignedToCustomer(customer, product) ?
      total + 1 : total,
      0
    );
  }

}