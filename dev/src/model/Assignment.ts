/**
 * A map of customers to products.
 * Can be evaluated for the score of the assignment.
 */

import { Product } from './Product';
import { Customer } from './Customer';
import _ from "lodash";
import { Order } from './Order';

export class Assignment {
  private _assignment: Map<Customer, Set<Product>;

  constructor(assignment: Map<Customer, Set<Product>> = new Map()) {
    this._assignment = assignment;
  }

  copy() {
    return new Assignment(new Map(this._assignment));
  }

  productsGivenTo(customer: Customer): Product[] {
    // convert set to array

    return Array.from(this._assignment.get(customer) ?? []);
  }

  assignProductToCustomer(customer: Customer, product: Product) {
    // throw error if customer is allergic to product
    if (customer.isAllergicToAny([product])) {
      throw new Error(`Customer ${customer.name} is allergic to ${product.name}`);
    }
    // throw error if customer already has product
    if (this.productsGivenTo(customer).includes(product)) {
      throw new Error(`Customer ${customer.name} already has ${product.name}`);
    }
    const products: Product[] = this.productsGivenTo(customer);
    this._assignment.set(customer, new Set(products.concat(product)));
    return this;
  }

  fulfillsOrders(orders: Order[]): boolean {
    return orders.every(([customer, size]) => this.productsGivenTo(customer).length === size);
  }

  cost(): number {
    return _.sum(
      Array.from(this._assignment.keys())
        .map(customer => this.costOfCustomer(customer))
    )
  }

  costOfCustomer(customer: Customer): number {
    return _.sum(
      this.productsGivenTo(customer).map(product => product.cost)
    );
  }

}
