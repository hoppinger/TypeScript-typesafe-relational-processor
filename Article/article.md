# A type-safe, in-memory database for TypeScript

In modern Single Page Application (SPA) development, we have a lot of data processing we need to perform locally. One of the biggest triggers for this article, is the following scenario\:

> For an awesome [online food ordering platform](beren.nl), we receive the following data from a Graph API\: `Restaurants -> Products -> [Categories, Options]` (thus we get a list of restaurants, each with a list of products inside, and each product contains a list of categories it falls under, and the options available for that product). 
> This appears to be the fastest query that the API supports, also because products are found in many categories (thus we get less duplicates!).
> The React renderer needs to sort products by category, and we also don't care about the restaurants because we are fetching the data for a single restaurant anyway. We need to turn the result of the query around, so that it looks like this\: `Categories -> Products -> Options`.
> And so, a tale of `Map`s, `Set`s, `flatMap`, etc. begins.

The resulting data processing code looks roughly like this\:

```ts
let res = restaurants.filter(restaurant => (restaurant.Restaurant_WaitingTimes.first() != undefined) && (restaurant.Restaurant_WaitingTimes.first().WaitingTimes != null))
      .map(restaurant => ({...restaurant,
                              PostCodeRanges: restaurant.Restaurant_PostCodeRange.flatMap(rpcr => rpcr.PostCodeRange.filter(pcr => pcr.Active).map(pcr =>
                              DeliveryClosingTimes: restaurant.Restaurant_DeliveryClosingTime.flatMap(r_dct => r_dct.DeliveryClosingTime.map(dct =>
                              DeliveryOpeningTimes: restaurant.Restaurant_DeliveryTimes.flatMap(r_dt => r_dt.DeliveryTimes.map(dt => ...),
                              PickupClosingTimes: restaurant.Restaurant_PickupClosingTime.flatMap(r_pct => r_pct.PickupClosingTime.map(pct =>
                              ...))).toList(),
                              PickupOpeningTimes: restaurant.Restaurant_PickupTimes.flatMap(r_pt => r_pt.PickupTimes.map(pt =>
                                        DeliveryPayMethods: restaurant.DeliveryRestaurant_DeliveryPayMethod.sortBy(dr_dpm => dr_dpm.DeliveryPayMethodId).flatMap(dr_dpm => dr_dpm.PayMethod.map(pm => ({Method: pm.Method, DisplayTitle: pm.DisplayTitle}))).toList(),
                                        PickUpPayMethods: restaurant.PickUpRestaurant_PickUpPayMethod.sortBy(pur_pupm => pur_pupm.PickUpPayMethodId).flatMap(pur_pupm => pur_pupm.PayMethod.map(pm => ({Method: pm.Method, DisplayTitle: pm.DisplayTitle}))).toList()
                              ...)

```

Notice the nesting of multiple `flatMap`, `map`, and `filter` operators. While I am personally very happy that developers in my team are using functional code, which is a bit more guaranteed to work properly than working with nested imperative containers, I have to say\: this stuff is complex!

Perhaps you recognize this sort of challenge. While there may not be anything exceptionally complex about this situation, and the code that is needed in order to tackle it, it will still be quite a lot of tedious work. The distance between explaining what needs to be done, and the code that does it, is also quite annoying\: ideally, we want declarative code that almost reads like a description of a user story, but in this case, programmers reading and modifying the code must drown in technicality about data structure processing and lookups. *This  situation is not ideal*.

For this reason, I embarked on a journey to define a library for declarative, client\-side data processing, that would make this sort of operation less painful, with easier to read code, and last but not least with all the support possible from the compiler.


## The underlying idea
Instead of processing data in this "raw" format, how about we sort it first into a sort of standard, and only then we reformat it and process it however we see fit? And as a standard, how about taking inspiration from both relational databases and Graph APIs? This way, we store data in a proven manner (entities and relations!) and we then access the data through simple, logical operators that convey the fact that entities and relations are indeed a graph.

The underlying containers will be offered by the awesome _immutablejs_ library, which features one of (the?) most complete collection libraries available nowadays on the market (and not only in the JavaScript world, but that is only my own opinion).

### A first example
We start by setting up a very simple database, comprised only of people. The definition of the types that make up the entities and the whole database will then look like this\:

```ts
interface Person {
    Name: string
    Surname: string
    Age: number
  }
```

Next, we define the "database" itself. We define a type (`MyEntities`) with a field for each table we want to store. Tables are declared with the generic `Entity` type, which takes as input the primary keys of the entity, the fields, and the relations\:

```ts
interface MyEntities {
  People: Entity<{ PersonId: number }, Person, {
  }, MyEntities>
}
```

Now, we fill up the database by creating an instance of it with sample data\:

```ts
const PersonId = Record({ PersonId: 0 })
    
const myEntities: MyEntities = {
  People: Entity<MyEntities>()(Map<Record<{ PersonId: number }>, Person>()
    .set(PersonId({ PersonId: 0 }), { Name: "John", Surname: "Doe", Age: 27 })
    .set(PersonId({ PersonId: 1 }), { Name: "Jane", Surname: "Doe", Age: 31 })
    .set(PersonId({ PersonId: 2 }), { Name: "Giuseppe", Surname: "Rossi", Age: 35})
    .set(PersonId({ PersonId: 3 }), { Name: "Giulia", Surname: "Verdi", Age: 34 })
    .set(PersonId({ PersonId: 4 }), { Name: "Reby", Surname: "Rossi", Age: 7 })
    .set(PersonId({ PersonId: 5 }), { Name: "Rechy", Surname: "Rossi", Age: 5 })
    .set(PersonId({ PersonId: 6 }), { Name: "Francis", Surname: "Dee Jay", Age: 35 })
  ,
  {
  })
}
```

> One minor oddity\: we have to use `Record` from _immutablejs_, otherwise the underlying constructs will complain. If only `TypeScript` supported *structural equality*...

Now we can instantiate the actual database, and run some queries on it!

```ts
const db: Database<MyEntities> = Database(myEntities)
```

Let's start with something easy. For each `Person`, we want their `Name` and `Surname`, thereby discarding the `Age`\:

```ts
const q0 = db.from("People").select("Name", "Surname")
```

This results in\:

```json
[
 {
  "Name": "John",
  "Surname": "Doe"
 },
 {
  "Name": "Jane",
  "Surname": "Doe"
 },
 ...
]
```

Let's filter all people with at least 18 years of `Age`\:


```ts
const q1 = db.from("People").filter(p => p.Age >= 18)
```

This results in\:

```json
[
 {
  "Name": "John",
  "Surname": "Doe",
  "Age": 27
 },
 {
  "Name": "Jane",
  "Surname": "Doe",
  "Age": 31
 },
 {
  "Name": "Giuseppe",
  "Surname": "Rossi",
  "Age": 35
 },
 {
  "Name": "Giulia",
  "Surname": "Verdi",
  "Age": 34
 },
 {
  "Name": "Francis",
  "Surname": "Dee Jay",
  "Age": 35
 }
]
```

We can obviously combine different operators in a chain. For example, after filtering, we can just select the `Name` attribute of each result\:

```ts
const q2 = db.from("People").filter(p => p.Age >= 18).select("Name")
```

Resulting in\:

```json
[
 {
  "Name": "John"
 },
 {
  "Name": "Jane"
 },
 {
  "Name": "Giuseppe"
 },
 {
  "Name": "Giulia"
 },
 {
  "Name": "Francis"
 }
]
```

We might also decide to rename fields. For example, suppose we need the `Name` of each person to become the `FirstName` attribute\:

```ts
const q3 = db.from("People").fieldAs("Name", "FirstName")
```

The result reflects this change in type\:

```json
[
 {
  "Surname": "Doe",
  "Age": 27,
  "FirstName": "John"
 },
 {
  "Surname": "Doe",
  "Age": 31,
  "FirstName": "Jane"
 },
...
]
```

Finally, we can mix all of these things together in a very big query. Imagination is the limit, not the library :)

```ts
const q4 = db.from("People").fieldAs("Name", "FirstName").select("FirstName").filter(p => p.FirstName.startsWith("Giu"))
```

Pretty neat, eh?


### How about type safety though?
So far, you might have noticed that we are using a lot of strings in our structures. Fortunately, TypeScript can be programmed in such a way as to understand that the strings we use for some inputs must be constrained to the keys/attributes of given types. This means that TypeScript will offer both input (via IntelliSense) and compiler validation to our code.

Here are a few of pictures illustrating this\:

![IntelliSense on fields][https://raw.githubusercontent.com/hoppinger/TypeScript-typesafe-relational-processor/master/Article/pics/FieldIntelliSense.png]

![Field validation][https://raw.githubusercontent.com/hoppinger/TypeScript-typesafe-relational-processor/master/Article/pics/FieldValidation.png]

![IntelliSense on lambda's][https://raw.githubusercontent.com/hoppinger/TypeScript-typesafe-relational-processor/master/Article/pics/LambdaIntellisense.png]

Notice that every sort of validation that could be performed, is performed. The IDE is able to give us advice (and the compiler will actually enforce it, so this is not just cosmetic!) on available fields, will disallow non\-existing fields, and will even compose the types of the (intermediate) results such as the fact that a field rename removes the original field and adds the new one.

Making *structural* mistakes with this kind of support is close to impossible, and requires a lot of discipline and motivation :)

##  A beefier example

