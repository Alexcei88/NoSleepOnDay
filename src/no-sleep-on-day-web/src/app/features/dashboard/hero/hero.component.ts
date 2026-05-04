import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  template: `
    <section class="hero">
      <div class="hero__intro">
        <p class="hero__eyebrow">Светлое утро уходит впустую</p>
        <h1 class="hero__title">Россия живёт в неудобном времени</h1>
        <p class="hero__lede">
          Утром солнце уже взошло — а мы ещё спим. Вечером ещё лето, ещё рано — а за окном
          уже ночь. Этот калькулятор показывает, сколько световых минут вы теряете каждый
          день и сколько вернётся, если ваш регион перевести на час вперёд.
        </p>
      </div>

      <div class="hero__visuals">
        <figure class="hero__panel hero__panel--morning">
          <img src="/illustrations/morning.svg" alt="Утро: солнце светит в окно, человек спит в кровати" />
          <figcaption>Солнце уже взошло — а вы ещё спите</figcaption>
        </figure>
        <figure class="hero__panel hero__panel--evening">
          <img src="/illustrations/evening.svg" alt="Вечер: за окном темно, дети сидят у телевизора" />
          <figcaption>Ещё лето, ещё рано — а на улице уже ночь</figcaption>
        </figure>
      </div>
    </section>
  `,
  styleUrl: './hero.component.scss',
})
export class HeroComponent {}
